# CodeSherlock — AI Codebase Investigator

**Find the cause. Understand the evidence. Review the fix. Test before you trust it.**

CodeSherlock is an AI-assisted code investigation website designed to help developers understand bugs that are difficult to trace across a software project. Instead of looking at a single error message in isolation, it builds an overview of the uploaded codebase, gathers relevant technical evidence, and helps the user investigate likely root causes, review a proposed patch, and run tests to check the result.

> **Access:** Open the CodeSherlock website URL supplied by the project team. A public URL has not been included in this document; insert it here once confirmed.

---

## 1. The Problem

Debugging a real project can mean moving between multiple source files, tracing function calls, interpreting stack traces, finding dependencies, and repeatedly running tests. This process becomes slower when the failure appears in one file but originates in another. General-purpose AI chat tools may also suggest fixes without enough grounding in the actual repository or a practical way to validate the result.

## 2. The Solution

CodeSherlock combines repository parsing, deterministic diagnostics, and generative AI investigation in one workspace. It helps users move from a bug report or stack trace to evidence-backed hypotheses and a reviewable candidate fix. Users remain in control: they can inspect source code and proposed changes, and test the candidate before deciding whether to use it.

## 3. Key Features

- **Repository upload and indexing:** Load a supported project from a ZIP archive so CodeSherlock can process its files and build a repository overview.
- **Demo project:** Open the built-in buggy sample project to explore the workflow without preparing your own codebase.
- **Cross-file bug investigation:** Describe a defect or provide a stack trace and ask the investigator to trace the issue across relevant files and functions.
- **Repository overview:** Review indexed files, code volume, functions, classes, and discovered test suites.
- **Source viewer:** Inspect project source files and the evidence referenced by an investigation.
- **Dependency and call relationships:** Explore relationships between project components to help understand how a failure may propagate.
- **Diagnostic findings:** Review likely causes and supporting evidence. Treat AI findings as hypotheses to verify, not as unquestionable facts.
- **Candidate patch review:** Inspect a suggested code change in the patch viewer before deciding whether it is appropriate.
- **Test verification:** Run the available Python unit tests against the baseline and, where supported, a candidate patch in an isolated execution environment. Compare results to see whether failures remain.
- **Investigation chat:** Ask follow-up questions about findings, source code, and possible fixes.
- **Investigation report:** Review or export a consolidated report of the investigation where the report controls are available.
- **Fallback diagnostics:** If Gemini is unavailable or its quota is reached, CodeSherlock can use its deterministic diagnostic engine for supported checks. Generative AI results may therefore not be available at all times.

## 4. How to Use the Website

### Step 1 — Open a project

1. Open the CodeSherlock website.
2. Choose the built-in demo project to try the application, or upload your own project as a ZIP archive.
3. Wait for the project to be processed and indexed.
4. Review the repository overview and any processing warnings.

**Tip:** For your first attempt, use the demo project. It is the quickest way to learn the interface and see the intended investigation flow.

### Step 2 — Describe the bug

In the investigation/chat area, either describe the unexpected behaviour in plain language or paste a relevant stack trace. Include useful context such as what you expected, what actually happened, and the steps that trigger the problem. A specific report generally gives the investigator a better starting point than “the code is broken.”

### Step 3 — Review the investigation

Read the proposed root-cause hypotheses and the evidence linked to them. Open the relevant files in the source viewer and check that the referenced code actually supports the explanation. Use the dependency/call relationship view where it helps explain how execution reaches the failing code.

### Step 4 — Inspect the proposed patch

Open the patch review view and examine the changed lines. Check whether the change addresses the identified cause, whether it introduces side effects, and whether it matches the project’s intended behaviour. **A generated patch is a proposal, not an automatic approval or a guarantee of correctness.**

### Step 5 — Run tests

Run the baseline tests first when possible, then run the tests against the candidate patch. Compare the number of passed, failed, and errored tests. A passing test suite is useful evidence, but it does not prove that every bug is fixed or that untested behaviour is correct. If test execution is unavailable for a project, review the error or limitation shown by the website.

### Step 6 — Ask follow-up questions and review the report

Use the chat to ask why a particular line matters, what assumptions the fix makes, or what additional test would help confirm the diagnosis. Finish by reviewing the investigation report and retaining the findings that are relevant to your work.

---

## 5. Technology Stack

The current implementation uses the following technologies:

| Area | Technology / role |
|---|---|
| Frontend | React 19 and TypeScript |
| Build and development server | Vite 8 |
| UI styling | Tailwind CSS 4 |
| UI animation | Motion |
| Icons | Lucide React |
| Backend/API server | Node.js with Express |
| AI integration | Google Gen AI SDK (`@google/genai`) |
| Main AI model configured in the code | `gemini-3.8-flash` |
| Archive processing | JSZip and application ZIP parsing utilities |
| Code understanding | Language-specific parsers, Python AST-based analysis where available, static diagnostic rules, and repository evidence collection |
| Test execution | Server-side Python `unittest` execution for supported Python test workflows, in an isolated temporary working area |

The application combines AI-generated analysis with deterministic parsing and diagnostic utilities. Feature availability can depend on the language and structure of the uploaded project.

## 6. AI Methodology and Implementation

CodeSherlock follows an evidence-first investigation workflow:

1. **Parse and index:** Extract files from the uploaded archive and construct a repository representation. The application identifies relevant source files and, where supported, functions, classes, tests, and relationships.
2. **Collect evidence:** Gather relevant source excerpts, stack-trace information, symbol and call relationships, static diagnostic observations, and available test context.
3. **Investigate with AI:** Send a structured investigation request and repository evidence to the configured Gemini model to produce root-cause hypotheses and candidate fixes.
4. **Ground and validate references:** Check proposed file paths, line references, and patch targets against the indexed repository where the implementation supports those checks.
5. **Review the candidate:** Present findings and proposed code changes for user inspection rather than silently changing the user's original project.
6. **Test the candidate:** For supported Python workflows, execute available unit tests and report the outcome so users can compare baseline and patched behaviour.
7. **Fallback:** When the AI service is unavailable, the application can run its deterministic diagnostic path for supported checks. This fallback is not equivalent to generative multi-file reasoning.

### Important limitations

- AI can produce incorrect explanations or patches. Always inspect the relevant code and test the proposed change.
- Test results only cover the tests that were actually discovered and executed.
- The current test workflow is focused on Python `unittest`; do not assume that every language, test framework, build system, or dependency setup is supported.
- Repository parsing and cross-file relationships may be incomplete for unsupported syntax or dynamic language behaviour.
- Do not upload confidential, proprietary, credential-bearing, or otherwise sensitive source code unless you are authorised to do so and understand how the deployment handles it.

## 7. AI Model and API Usage

The current source code configures **Google Gemini `gemini-3.8-flash`** through Google’s Gen AI SDK. The server exposes application endpoints for AI status, investigation, and follow-up chat. The model is used to analyse the structured evidence gathered from the repository and return investigation results or candidate fixes.

- **Model configured:** `gemini-3.8-flash` (as specified in the supplied project source).
- **SDK:** `@google/genai`.
- **Credential:** The server reads `GEMINI_API_KEY` from its environment configuration. The key must remain server-side and must never be placed in frontend code or published in screenshots.
- **Quota/service availability:** AI requests can fail if the key is missing, the service is unavailable, or the applicable quota is exhausted. In such cases, the site may report the issue and use deterministic fallback diagnostics.
- **Billing note:** The project source describes the configured model as intended for free-tier use. Actual model availability, quotas, and billing terms are controlled by Google and can change; verify the current terms for the API key being used. Do not interpret this README as a guarantee that API usage can never incur a charge.

The model name above reflects the supplied code, not an independent confirmation that the model is currently available for every Google AI account or deployment.

## 8. Website Setup and Availability

### For website users

No local installation is required when using a hosted deployment. Open the URL provided by the team in a supported modern browser, then load the demo project or upload a ZIP archive. If the website is not publicly deployed, ask the project team for the current hosted or demonstration instance.

### For the team operating the website

The website requires a running application server and, for generative AI features, a valid server-side Google Gemini API key. The team should configure `GEMINI_API_KEY` and the server port in the deployment environment, keep secrets out of the browser bundle, and confirm that AI status and test execution work before sharing the website. The source package includes an `.env.example` file showing the expected key variable. Deployment commands and hosting details are intentionally not the focus of this product guide.

---

## 9. Product Screenshots

Add screenshots captured from the actual running website in this section. The ZIP supplied for documentation did not include confirmed product screenshots, so the following are suggested screenshot slots rather than claims that images are already present.

| Screenshot | What it should demonstrate |
|---|---|
| **1. Landing page** | CodeSherlock introduction and the options to start with a demo or upload a project. |
| **2. Repository dashboard** | Indexed repository overview, file counts, and discovered project structure. |
| **3. Investigation results** | A bug description or stack trace with root-cause hypotheses and evidence. |
| **4. Source and dependency views** | Source code inspection and relevant component relationships. |
| **5. Patch review** | Candidate code changes before acceptance. |
| **6. Test results and report** | Baseline-versus-patched test outcomes and the final investigation report. |

Suggested image paths once screenshots are added: `docs/screenshots/landing-page.png`, `repository-dashboard.png`, `investigation-results.png`, `source-dependencies.png`, `patch-review.png`, and `test-results-report.png`.

**Screenshot guidance:** Capture the real interface at a readable resolution. Use the demo project if necessary, and remove API keys, private code, personal information, and other sensitive details before sharing images.

## 10. Team Member Contributions

Replace the placeholders below with the actual team names and verified contributions before submission. Do not claim an individual contribution unless the person performed or materially supported that work.

| Team member | Contribution |
|---|---|
| **Syed Umar Ali** | [Project Lead, requirements, coordination, and product direction] |
| **Syeda Noor Fatima** | [Frontend, user interface, and website interaction flow] |
| **Syed Abeer Ali** | [Backend APIs, AI model integration, and prompt/evidence workflow] |
| **Hannan Sidiq** | [Repository parsing, diagnostic logic, patch review, testing, and validation] |
| **Muhammad Ahmed** | [UI/UX, product testing, screenshots, documentation, and presentation] |

If responsibilities overlapped, describe the shared work rather than forcing an artificial division.

## 11. Responsible Use

CodeSherlock is a developer-assistance tool, not a substitute for engineering review. Review generated changes, run relevant tests, and use version control or a backup before applying fixes to important projects. Never expose API credentials, and only upload source code that you have permission to process.

---

**CodeSherlock — AI Codebase Investigator**  
*Investigate the evidence. Understand the cause. Validate the fix.*
