# Codex Prompt Kit for Architecture-Led Code Walkthroughs

Use these prompts to generate structured explanations for recording technical walkthrough videos.

## 1) Master Prompt (Run First)

```text
You are a senior software engineer and technical instructor.

Your task is to:
1. Read my entire codebase.
2. Break the project into logical modules.
3. For each module, generate:
   - purpose
   - how it works
   - key files
   - data flow

4. Then create a VIDEO RECORDING PLAN:
   - session title
   - files to cover
   - expected duration (30–90 min per session)
   - what to explain in each session

Make it detailed enough so I can record a comprehensive code walkthrough series.

Important:
- Focus on explanation, not code writing
- Make it suitable for a student explaining understanding
- Keep it natural and realistic (like a human walkthrough)
- Do not invent work or claim tasks were completed if not evidenced in the repository.
```

## 2) File / Code Explanation Prompt

```text
Explain this file as if I am recording a video walkthrough.

Give output in this format:

1. Simple explanation (what this file does)
2. Function-by-function explanation
3. Data flow (input -> processing -> output)
4. Edge cases / error handling
5. Possible improvements
6. Real-life analogy (to explain easily in video)

Also include:
- what I should say while explaining this file
- where I should pause and elaborate
- how to expand this explanation naturally using architecture rationale, trade-offs, and verification examples

Do not invent work or claim tasks were completed if not evidenced in the repository.
```

## 3) Deep Explanation Prompt

```text
For this code, give a deep explanation suitable for a 1-hour discussion.

Include:
- internal logic breakdown
- why this approach is used
- alternative implementations
- performance considerations
- scalability concerns
- what could break and why

Also provide:
- questions I can ask myself while explaining
- points where I can think aloud (to sound natural)

Do not invent work or claim tasks were completed if not evidenced in the repository.
```

## 4) Teleprompter Prompt

```text
Convert this code into a speaking script for video recording.

Rules:
- Use simple spoken language (not textbook)
- Keep sentences natural
- Add pauses like "let me check this part..."
- Add thinking phrases like "I believe this is doing..."
- Make it sound like real explanation, not memorized

Format:
- bullet points
- short sentences
- easy to read while recording

Do not invent work or claim tasks were completed if not evidenced in the repository.
```

## 5) Session Expansion Prompt

```text
I want to expand this file explanation into a 60-minute technical walkthrough session.

Give:
- additional topics I can discuss
- deeper explanation points
- debugging scenarios
- risk/failure discussions
- improvements and refactoring ideas

Make sure content is realistic and not repetitive.
Do not invent work or claim tasks were completed if not evidenced in the repository.
```

## 6) Architecture Explanation Prompt

```text
Explain the full project architecture in a way I can record a 1-2 hour walkthrough.

Include:
- high level system design
- module interaction
- request flow
- data flow and storage interaction
- external integrations

Also:
- give simple explanation first
- then deep technical explanation
- include diagram explanations (verbal)

Do not invent work or claim tasks were completed if not evidenced in the repository.
```

## Suggested Workflow

1. Run the Master Prompt.
2. Select one module or file.
3. Run the File Explanation Prompt.
4. Generate speaking bullets with the Teleprompter Prompt.
5. Record session in editor + terminal + docs view.
6. Log video metadata in `VIDEO_EVIDENCE_LOG.md`.
