# Sequential Thinking MCP Server

An MCP server implementation that provides a tool for dynamic and reflective problem-solving through a structured thinking process with enhanced confidence scoring capabilities based on Yang et al. (2024) research methodology.

## Features

### Core Thinking Process
- Break down complex problems into manageable steps
- Revise and refine thoughts as understanding deepens
- Branch into alternative paths of reasoning
- Adjust the total number of thoughts dynamically
- Generate and verify solution hypotheses

### Enhanced Confidence Scoring (Yang et al. 2024)
- **Verbalized Confidence Scores**: Express confidence levels (0.0-1.0) with explicit reasoning
- **Uncertainty Factor Tracking**: Identify and document specific sources of uncertainty
- **Calibration Metrics**: Monitor confidence accuracy and detect overconfidence patterns
- **Confidence-Based Decision Making**: Use confidence scores to improve reasoning quality
- **Uncertainty Awareness**: Quantify and improve recognition of uncertain situations

## Tool

### sequential_thinking

Facilitates a detailed, step-by-step thinking process for problem-solving and analysis with advanced confidence scoring capabilities.

**Core Parameters:**
- `thought` (string): The current thinking step
- `nextThoughtNeeded` (boolean): Whether another thought step is needed
- `thoughtNumber` (integer): Current thought number
- `totalThoughts` (integer): Estimated total thoughts needed
- `isRevision` (boolean, optional): Whether this revises previous thinking
- `revisesThought` (integer, optional): Which thought is being reconsidered
- `branchFromThought` (integer, optional): Branching point thought number
- `branchId` (string, optional): Branch identifier
- `needsMoreThoughts` (boolean, optional): If more thoughts are needed

**Enhanced Confidence Parameters:**
- `confidenceScore` (number, 0.0-1.0, optional): Verbalized confidence level for the current thought
  - **0.9-1.0**: Very High confidence - Strong evidence, clear reasoning, high certainty
  - **0.8-0.89**: High confidence - Good evidence, solid reasoning, minor uncertainties
  - **0.6-0.79**: Medium confidence - Some evidence, reasonable approach, notable uncertainties
  - **0.4-0.59**: Low confidence - Limited evidence, uncertain approach, significant doubts
  - **0.0-0.39**: Very Low confidence - Minimal evidence, speculative reasoning, high uncertainty
- `confidenceReasoning` (string, optional): Explicit explanation for the confidence level
- `uncertaintyFactors` (array of strings, optional): Specific factors contributing to uncertainty
- `calibrationMetrics` (object, optional): Confidence accuracy tracking
  - `previousAccuracy` (number, 0.0-1.0): Track accuracy of previous confidence predictions
  - `overconfidencePattern` (boolean): Flag for systematic overconfidence detection
  - `uncertaintyAwareness` (number, 0.0-1.0): Score for uncertainty recognition capability

## Usage

### Core Use Cases
The Sequential Thinking tool is designed for:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

### Confidence Scoring Use Cases
Enhanced confidence scoring is particularly valuable for:
- **High-stakes decision making**: Where understanding certainty levels is critical
- **Complex problem solving**: When multiple valid approaches exist
- **Collaborative reasoning**: When confidence alignment improves team performance
- **Learning and calibration**: When improving judgment accuracy over time
- **Risk assessment**: When uncertainty quantification affects outcomes
- **Research and analysis**: When evidence quality varies significantly

### Confidence Scoring Best Practices

1. **Always explain your confidence**: Use `confidenceReasoning` to justify your score
2. **Be specific about uncertainty**: Use `uncertaintyFactors` to identify exact sources of doubt
3. **Consider multiple dimensions**: Evidence quality, problem complexity, time constraints, etc.
4. **Track your accuracy**: Use `calibrationMetrics` to improve over time
5. **Be honest about limitations**: Lower scores for novel or complex situations
6. **Update confidence dynamically**: As new information becomes available

### Example Confidence Usage

```json
{
  "thought": "Based on the market research data, I believe the product launch should target Q2 2024",
  "thoughtNumber": 3,
  "totalThoughts": 5,
  "nextThoughtNeeded": true,
  "confidenceScore": 0.75,
  "confidenceReasoning": "Strong market indicators and competitive analysis support this timing, but economic uncertainty creates some risk",
  "uncertaintyFactors": ["economic volatility", "competitor response unpredictable", "supply chain variables"],
  "calibrationMetrics": {
    "previousAccuracy": 0.82,
    "uncertaintyAwareness": 0.88
  }
}
```

## Configuration

### Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

#### npx

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}
```

#### docker

```json
{
  "mcpServers": {
    "sequentialthinking": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "mcp/sequentialthinking"
      ]
    }
  }
}
```

#### local development

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "/path/to/modelcontextprotocol-servers/src/sequentialthinking/dist/index.js"
    }
  }
}
```

To disable logging of thought information set env var: `DISABLE_THOUGHT_LOGGING` to `true`.

### Usage with VS Code

For quick installation, click one of the installation buttons below...

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=sequentialthinking&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40modelcontextprotocol%2Fserver-sequential-thinking%22%5D%7D) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPM-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=sequentialthinking&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40modelcontextprotocol%2Fserver-sequential-thinking%22%5D%7D&quality=insiders)

[![Install with Docker in VS Code](https://img.shields.io/badge/VS_Code-Docker-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=sequentialthinking&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22mcp%2Fsequentialthinking%22%5D%7D) [![Install with Docker in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Docker-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=sequentialthinking&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22mcp%2Fsequentialthinking%22%5D%7D&quality=insiders)

For manual installation, you can configure the MCP server using one of these methods:

**Method 1: User Configuration (Recommended)**
Add the configuration to your user-level MCP configuration file. Open the Command Palette (`Ctrl + Shift + P`) and run `MCP: Open User Configuration`. This will open your user `mcp.json` file where you can add the server configuration.

**Method 2: Workspace Configuration**
Alternatively, you can add the configuration to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others.

> For more details about MCP configuration in VS Code, see the [official VS Code MCP documentation](https://code.visualstudio.com/docs/copilot/mcp).

For NPX installation:

```json
{
  "servers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}
```

For Docker installation:

```json
{
  "servers": {
    "sequential-thinking": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "mcp/sequentialthinking"
      ]
    }
  }
}
```

## Building

Docker:

```bash
docker build -t mcp/sequentialthinking -f src/sequentialthinking/Dockerfile .
```

## Research Foundation

The confidence scoring enhancements in this MCP server are based on established research in AI confidence calibration:

### Primary Research
- **Yang, Tsai, and Yamada (2024)**: "On Verbalized Confidence Scores for LLMs" - The foundational methodology for asking AI models to verbalize confidence levels as part of their output tokens
- **Li et al. (2025)**: "As Confidence Aligns: Exploring the Effect of AI Confidence on Human Self-confidence in Human-AI Decision Making" - Research on confidence alignment effects in human-AI collaboration
- **Ma et al. (2024)**: "Are You Really Sure?" - Studies on confidence calibration improving human-AI team performance by up to 50%

### Key Research Findings
1. **Verbalized confidence scores become reliable indicators** when proper prompting methods are employed
2. **Human self-confidence aligns with AI confidence** during collaborative tasks
3. **Confidence calibration interventions** can dramatically improve decision-making quality
4. **Systematic confidence tracking** helps identify and correct overconfidence patterns

The implementation follows the Yang et al. (2024) methodology for model-agnostic confidence quantification with minimal computational overhead, providing a research-backed approach to uncertainty expression in sequential thinking processes.

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
