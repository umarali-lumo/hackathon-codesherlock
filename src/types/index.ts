export interface SourceFile {
  path: string;
  name: string;
  content: string;
  language: string;
  size: number;
  isTest: boolean;
  loc: number;
}

export interface SymbolInfo {
  name: string;
  kind: 'function' | 'class' | 'method';
  lineStart: number;
  lineEnd: number;
  args?: string[];
  bases?: string[];
  docstring?: string | null;
  file: string;
}

export interface ImportInfo {
  module: string;
  importedFrom?: string;
  symbol?: string;
  asname?: string | null;
  line: number;
  file: string;
}

export interface CallInfo {
  name: string;
  line: number;
  file: string;
  callerSymbol?: string;
}

export interface FileAnalysis {
  file: string;
  syntaxError: {
    line: number;
    offset?: number;
    msg: string;
    text?: string;
  } | null;
  functions: SymbolInfo[];
  classes: SymbolInfo[];
  imports: ImportInfo[];
  calls: CallInfo[];
  loc: number;
}

export interface StackTraceFrame {
  file: string;
  line: number;
  functionName: string;
  codeSnippet?: string;
  raw: string;
  existsInRepo: boolean;
  matchedRepoFile?: string;
}

export interface ParsedStackTrace {
  exceptionType: string;
  exceptionMessage: string;
  frames: StackTraceFrame[];
  rawText: string;
  topRepoFrame?: StackTraceFrame;
}

export interface CandidatePatch {
  targetFile: string;
  originalCode: string;
  patchedCode: string;
  unifiedDiff: string;
  description: string;
  applied?: boolean;
}

export interface SuggestedTest {
  testName: string;
  description: string;
  testCode: string;
}

export interface DiagnosticFinding {
  id: string;
  rank?: number;
  title: string;
  hypothesis: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  file: string;
  line: number;
  codeContext: string;
  functionName?: string;
  explanation: string;
  evidenceSupport?: string;
  recommendedNextStep: string;
  alternativeExplanations?: string;
  candidatePatch?: CandidatePatch;
  callStackContext?: string[];
  engineType?: 'gemini-ai' | 'deterministic-engine';
  modelName?: string;
  verifiedInRepo?: boolean;
  dependencyVerified?: boolean;
  category?: 'ai-hypothesis' | 'static-analysis' | 'test-failure';
}

export interface TestRunResult {
  ran: boolean;
  total: number;
  passed: number;
  failed: number;
  errors: number;
  exitCode: number;
  rawOutput: string;
  timedOut?: boolean;
  patchApplied?: boolean;
  timestamp: string;
}

export interface EvidencePackage {
  stackTrace?: ParsedStackTrace;
  callEdges: {
    callerFile: string;
    callerFunction?: string;
    calleeFile: string;
    calleeFunction: string;
    line: number;
  }[];
  imports: {
    file: string;
    module: string;
    symbol?: string;
    line: number;
  }[];
  staticFindings: {
    file: string;
    type: string;
    message: string;
    line: number;
  }[];
  testFailures: {
    testName?: string;
    outputSnippet: string;
  }[];
  relevantFiles: {
    path: string;
    relevanceReason: string;
    lineStart?: number;
    lineEnd?: number;
    content: string;
  }[];
  totalEvidenceItems: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  stepProgress?: { step: number; total: number; label: string }[];
  stackTrace?: ParsedStackTrace;
  findings?: DiagnosticFinding[];
  isStreaming?: boolean;
  suggestedPrompts?: string[];
  engineType?: 'gemini-ai' | 'deterministic-engine';
  modelName?: string;
  mostPlausibleRootCause?: string;
  crossFileAnalysis?: string;
  missingInformation?: string;
  targetedDebuggingSteps?: string[];
  suggestedTests?: SuggestedTest[];
  evidenceCount?: number;
  isRateLimited?: boolean;
}

export interface RepositoryData {
  name: string;
  files: SourceFile[];
  analyses: Record<string, FileAnalysis>;
  totalLoc: number;
  totalFunctions: number;
  totalClasses: number;
  languages: Record<string, number>;
  testFiles: string[];
  createdAt: string;
}

export interface WhyFailedHereResult {
  crashSite: {
    file: string;
    line: number;
    codeSnippet: string;
    exceptionType?: string;
    observedBehavior: string;
  };
  originSite: {
    file: string;
    line: number;
    codeSnippet: string;
    culpritSymbol: string;
    rootCauseDescription: string;
  };
  propagationPath: {
    step: number;
    file: string;
    line: number;
    functionName: string;
    description: string;
    codeSnippet?: string;
  }[];
  explanation: string;
  suggestedAction: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface VariableTraceStep {
  step: number;
  type: 'INITIALIZED' | 'MODIFIED' | 'PASSED' | 'USED' | 'FAILED';
  file: string;
  line: number;
  functionName?: string;
  codeSnippet: string;
  explanation: string;
  variableState?: string;
}

export interface VariableTraceResult {
  variableName: string;
  summary: string;
  lifecycle: {
    initialized?: { file: string; line: number; description: string };
    modifiedCount: number;
    passedCount: number;
    usedCount: number;
  };
  chain: VariableTraceStep[];
  potentialRisk?: string;
}

export interface LineReasoning {
  line: number;
  type: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'KEPT';
  code: string;
  reason: string;
}

export interface MinimalFixProposal {
  targetFile: string;
  originalSnippet: string;
  patchedSnippet: string;
  linesChangedCount: number;
  unifiedDiff: string;
  reasoningPerLine: LineReasoning[];
  collateralRisk: 'LOW' | 'MINIMAL' | 'ZERO';
  riskExplanation: string;
  preValidationChecks: string[];
}
