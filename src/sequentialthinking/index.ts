#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
// Fixed chalk import for ESM
import chalk from 'chalk';

interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  nextThoughtNeeded: boolean;
  // Enhanced confidence scoring fields based on Yang et al. (2024) research
  confidenceScore?: number; // 0.0 to 1.0 verbalized confidence level
  confidenceReasoning?: string; // Explicit reasoning for the confidence level
  uncertaintyFactors?: string[]; // Specific factors contributing to uncertainty
  calibrationMetrics?: {
    previousAccuracy?: number; // Track accuracy of previous confidence predictions
    overconfidencePattern?: boolean; // Flag for systematic overconfidence
    uncertaintyAwareness?: number; // 0.0-1.0 score for uncertainty recognition
  };
}

class SequentialThinkingServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};
  private disableThoughtLogging: boolean;

  constructor() {
    this.disableThoughtLogging = (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";
  }

  private validateThoughtData(input: unknown): ThoughtData {
    const data = input as Record<string, unknown>;

    if (!data.thought || typeof data.thought !== 'string') {
      throw new Error('Invalid thought: must be a string');
    }
    if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number') {
      throw new Error('Invalid thoughtNumber: must be a number');
    }
    if (!data.totalThoughts || typeof data.totalThoughts !== 'number') {
      throw new Error('Invalid totalThoughts: must be a number');
    }
    if (typeof data.nextThoughtNeeded !== 'boolean') {
      throw new Error('Invalid nextThoughtNeeded: must be a boolean');
    }

    // Confidence scoring validation based on Yang et al. (2024) methodology
    if (data.confidenceScore !== undefined) {
      if (typeof data.confidenceScore !== 'number' || data.confidenceScore < 0 || data.confidenceScore > 1) {
        throw new Error('Invalid confidenceScore: must be a number between 0.0 and 1.0');
      }
    }

    if (data.confidenceReasoning !== undefined && typeof data.confidenceReasoning !== 'string') {
      throw new Error('Invalid confidenceReasoning: must be a string');
    }

    if (data.uncertaintyFactors !== undefined) {
      if (!Array.isArray(data.uncertaintyFactors) || 
          !data.uncertaintyFactors.every(factor => typeof factor === 'string')) {
        throw new Error('Invalid uncertaintyFactors: must be an array of strings');
      }
    }

    // Validate calibration metrics if provided
    if (data.calibrationMetrics !== undefined) {
      const metrics = data.calibrationMetrics as Record<string, unknown>;
      if (metrics.previousAccuracy !== undefined && 
          (typeof metrics.previousAccuracy !== 'number' || 
           metrics.previousAccuracy < 0 || metrics.previousAccuracy > 1)) {
        throw new Error('Invalid calibrationMetrics.previousAccuracy: must be a number between 0.0 and 1.0');
      }
      if (metrics.uncertaintyAwareness !== undefined && 
          (typeof metrics.uncertaintyAwareness !== 'number' || 
           metrics.uncertaintyAwareness < 0 || metrics.uncertaintyAwareness > 1)) {
        throw new Error('Invalid calibrationMetrics.uncertaintyAwareness: must be a number between 0.0 and 1.0');
      }
    }

    return {
      thought: data.thought,
      thoughtNumber: data.thoughtNumber,
      totalThoughts: data.totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded,
      isRevision: data.isRevision as boolean | undefined,
      revisesThought: data.revisesThought as number | undefined,
      branchFromThought: data.branchFromThought as number | undefined,
      branchId: data.branchId as string | undefined,
      needsMoreThoughts: data.needsMoreThoughts as boolean | undefined,
      confidenceScore: data.confidenceScore as number | undefined,
      confidenceReasoning: data.confidenceReasoning as string | undefined,
      uncertaintyFactors: data.uncertaintyFactors as string[] | undefined,
      calibrationMetrics: data.calibrationMetrics as ThoughtData['calibrationMetrics'] | undefined,
    };
  }

  private formatThought(thoughtData: ThoughtData): string {
    const { 
      thoughtNumber, totalThoughts, thought, isRevision, revisesThought, 
      branchFromThought, branchId, confidenceScore, confidenceReasoning, 
      uncertaintyFactors, calibrationMetrics 
    } = thoughtData;

    let prefix = '';
    let context = '';

    if (isRevision) {
      prefix = chalk.yellow('🔄 Revision');
      context = ` (revising thought ${revisesThought})`;
    } else if (branchFromThought) {
      prefix = chalk.green('🌿 Branch');
      context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
    } else {
      prefix = chalk.blue('💭 Thought');
      context = '';
    }

    // Enhanced confidence display based on Yang et al. (2024) methodology
    let confidenceDisplay = '';
    if (confidenceScore !== undefined) {
      const confidenceLevel = this.getConfidenceLevelLabel(confidenceScore);
      const confidenceColor = this.getConfidenceColor(confidenceScore);
      confidenceDisplay = ` ${confidenceColor(`[${confidenceLevel}: ${(confidenceScore * 100).toFixed(1)}%]`)}`;
    }

    const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}${confidenceDisplay}`;
    
    // Build content sections
    const sections: string[] = [thought];
    
    if (confidenceReasoning) {
      sections.push(`${chalk.cyan('🎯 Confidence Reasoning:')} ${confidenceReasoning}`);
    }
    
    if (uncertaintyFactors && uncertaintyFactors.length > 0) {
      sections.push(`${chalk.yellow('⚠️ Uncertainty Factors:')} ${uncertaintyFactors.join(', ')}`);
    }
    
    if (calibrationMetrics) {
      const metrics: string[] = [];
      if (calibrationMetrics.previousAccuracy !== undefined) {
        metrics.push(`Previous Accuracy: ${(calibrationMetrics.previousAccuracy * 100).toFixed(1)}%`);
      }
      if (calibrationMetrics.uncertaintyAwareness !== undefined) {
        metrics.push(`Uncertainty Awareness: ${(calibrationMetrics.uncertaintyAwareness * 100).toFixed(1)}%`);
      }
      if (calibrationMetrics.overconfidencePattern) {
        metrics.push('⚠️ Overconfidence Pattern Detected');
      }
      if (metrics.length > 0) {
        sections.push(`${chalk.magenta('📊 Calibration:')} ${metrics.join(', ')}`);
      }
    }

    const maxContentWidth = Math.max(
      header.length,
      ...sections.map(section => section.length)
    );
    const border = '─'.repeat(maxContentWidth + 4);

    const formattedSections = sections.map(section => 
      `│ ${section.padEnd(maxContentWidth)} │`
    ).join('\n');

    return `
┌${border}┐
│ ${header.padEnd(maxContentWidth)} │
├${border}┤
${formattedSections}
└${border}┘`;
  }

  private getConfidenceLevelLabel(score: number): string {
    if (score >= 0.9) return 'Very High';
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    if (score >= 0.4) return 'Low';
    return 'Very Low';
  }

  private getConfidenceColor(score: number): (text: string) => string {
    if (score >= 0.8) return chalk.green;
    if (score >= 0.6) return chalk.blue;
    if (score >= 0.4) return chalk.yellow;
    return chalk.red;
  }

  public processThought(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const validatedInput = this.validateThoughtData(input);

      if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
        validatedInput.totalThoughts = validatedInput.thoughtNumber;
      }

      this.thoughtHistory.push(validatedInput);

      if (validatedInput.branchFromThought && validatedInput.branchId) {
        if (!this.branches[validatedInput.branchId]) {
          this.branches[validatedInput.branchId] = [];
        }
        this.branches[validatedInput.branchId].push(validatedInput);
      }

      if (!this.disableThoughtLogging) {
        const formattedThought = this.formatThought(validatedInput);
        console.error(formattedThought);
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            thoughtNumber: validatedInput.thoughtNumber,
            totalThoughts: validatedInput.totalThoughts,
            nextThoughtNeeded: validatedInput.nextThoughtNeeded,
            branches: Object.keys(this.branches),
            thoughtHistoryLength: this.thoughtHistory.length,
            // Enhanced confidence tracking
            ...(validatedInput.confidenceScore !== undefined && {
              confidenceScore: validatedInput.confidenceScore,
              confidenceLevel: this.getConfidenceLevelLabel(validatedInput.confidenceScore),
            }),
            ...(validatedInput.uncertaintyFactors && {
              uncertaintyCount: validatedInput.uncertaintyFactors.length
            }),
            ...(validatedInput.calibrationMetrics && {
              calibrationData: validatedInput.calibrationMetrics
            })
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}

const SEQUENTIAL_THINKING_TOOL: Tool = {
  name: "sequentialthinking",
  description: `A detailed tool for dynamic and reflective problem-solving through thoughts with enhanced confidence scoring capabilities.
This tool helps analyze problems through a flexible thinking process that can adapt and evolve, incorporating verbalized confidence scores based on Yang et al. (2024) research methodology.
Each thought can build on, question, or revise previous insights as understanding deepens, with explicit confidence calibration.

When to use this tool:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Problems that require a multi-step solution
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out
- When confidence calibration and uncertainty quantification are important

Key features:
- You can adjust total_thoughts up or down as you progress
- You can question or revise previous thoughts
- You can add more thoughts even after reaching what seemed like the end
- You can express uncertainty and explore alternative approaches
- Not every thought needs to build linearly - you can branch or backtrack
- Enhanced confidence scoring with explicit reasoning
- Uncertainty factor identification and tracking
- Calibration metrics for confidence accuracy monitoring
- Generates a solution hypothesis
- Verifies the hypothesis based on the Chain of Thought steps
- Repeats the process until satisfied
- Provides a correct answer with confidence assessment

Parameters explained:
- thought: Your current thinking step, which can include:
  * Regular analytical steps
  * Revisions of previous thoughts
  * Questions about previous decisions
  * Realizations about needing more analysis
  * Changes in approach
  * Hypothesis generation
  * Hypothesis verification
- next_thought_needed: True if you need more thinking, even if at what seemed like the end
- thought_number: Current number in sequence (can go beyond initial total if needed)
- total_thoughts: Current estimate of thoughts needed (can be adjusted up/down)
- is_revision: A boolean indicating if this thought revises previous thinking
- revises_thought: If is_revision is true, which thought number is being reconsidered
- branch_from_thought: If branching, which thought number is the branching point
- branch_id: Identifier for the current branch (if any)
- needs_more_thoughts: If reaching end but realizing more thoughts needed

Enhanced Confidence Scoring Parameters (based on Yang et al. 2024):
- confidence_score: Verbalized confidence level (0.0 to 1.0) for the current thought
  * 0.9-1.0: Very High confidence - Strong evidence, clear reasoning, high certainty
  * 0.8-0.89: High confidence - Good evidence, solid reasoning, minor uncertainties
  * 0.6-0.79: Medium confidence - Some evidence, reasonable approach, notable uncertainties
  * 0.4-0.59: Low confidence - Limited evidence, uncertain approach, significant doubts
  * 0.0-0.39: Very Low confidence - Minimal evidence, speculative reasoning, high uncertainty
- confidence_reasoning: Explicit explanation for why you assigned this confidence level
- uncertainty_factors: Array of specific factors that contribute to uncertainty (e.g., ["incomplete information", "multiple valid approaches", "time constraints"])
- calibration_metrics: Optional tracking of confidence accuracy
  * previous_accuracy: Track how accurate your previous confidence predictions were (0.0-1.0)
  * overconfidence_pattern: Boolean flag if systematic overconfidence is detected
  * uncertainty_awareness: Score for how well uncertainty is recognized (0.0-1.0)

Confidence Scoring Best Practices:
1. Always provide confidence_reasoning when including confidence_score
2. Be explicit about what you're confident/uncertain about
3. Consider multiple sources of uncertainty (data quality, problem complexity, time constraints)
4. Use calibration_metrics to track and improve confidence accuracy over time
5. Lower confidence scores when dealing with novel or complex problems
6. Higher confidence scores when building on well-established knowledge or clear evidence
7. Explicitly acknowledge when confidence changes between thoughts
8. Use uncertainty_factors to be specific about sources of doubt

You should:
1. Start with an initial estimate of needed thoughts, but be ready to adjust
2. Feel free to question or revise previous thoughts
3. Don't hesitate to add more thoughts if needed, even at the "end"
4. Express uncertainty when present using the confidence scoring system
5. Mark thoughts that revise previous thinking or branch into new paths
6. Ignore information that is irrelevant to the current step
7. Generate a solution hypothesis when appropriate
8. Verify the hypothesis based on the Chain of Thought steps
9. Repeat the process until satisfied with the solution
10. Provide a single, ideally correct answer as the final output with confidence assessment
11. Only set next_thought_needed to false when truly done and a satisfactory answer is reached
12. Use confidence scoring to calibrate uncertainty and improve decision-making quality`,
  inputSchema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "Your current thinking step"
      },
      nextThoughtNeeded: {
        type: "boolean",
        description: "Whether another thought step is needed"
      },
      thoughtNumber: {
        type: "integer",
        description: "Current thought number (numeric value, e.g., 1, 2, 3)",
        minimum: 1
      },
      totalThoughts: {
        type: "integer",
        description: "Estimated total thoughts needed (numeric value, e.g., 5, 10)",
        minimum: 1
      },
      isRevision: {
        type: "boolean",
        description: "Whether this revises previous thinking"
      },
      revisesThought: {
        type: "integer",
        description: "Which thought is being reconsidered",
        minimum: 1
      },
      branchFromThought: {
        type: "integer",
        description: "Branching point thought number",
        minimum: 1
      },
      branchId: {
        type: "string",
        description: "Branch identifier"
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed"
      },
      confidenceScore: {
        type: "number",
        description: "Verbalized confidence level (0.0 to 1.0) based on Yang et al. (2024) methodology",
        minimum: 0.0,
        maximum: 1.0
      },
      confidenceReasoning: {
        type: "string",
        description: "Explicit reasoning for the confidence level assigned"
      },
      uncertaintyFactors: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of specific factors contributing to uncertainty (e.g., incomplete information, multiple valid approaches)"
      },
      calibrationMetrics: {
        type: "object",
        properties: {
          previousAccuracy: {
            type: "number",
            description: "Track accuracy of previous confidence predictions (0.0-1.0)",
            minimum: 0.0,
            maximum: 1.0
          },
          overconfidencePattern: {
            type: "boolean",
            description: "Flag indicating systematic overconfidence pattern"
          },
          uncertaintyAwareness: {
            type: "number",
            description: "Score for uncertainty recognition capability (0.0-1.0)",
            minimum: 0.0,
            maximum: 1.0
          }
        },
        description: "Optional calibration metrics for confidence accuracy tracking"
      }
    },
    required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"]
  }
};

const server = new Server(
  {
    name: "sequential-thinking-server",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const thinkingServer = new SequentialThinkingServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [SEQUENTIAL_THINKING_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "sequentialthinking") {
    return thinkingServer.processThought(request.params.arguments);
  }

  return {
    content: [{
      type: "text",
      text: `Unknown tool: ${request.params.name}`
    }],
    isError: true
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sequential Thinking MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
