# ADR 0001: Keep the rule-based parser as the default

## Context

Invoice creation should remain useful without an API key and should produce
predictable results for a portfolio demo. A hosted model also adds cost,
latency and privacy considerations.

## Decision

The deterministic parser is the default. An optional OpenAI provider can enrich
ambiguous prompts when configured, while the parser remains the fallback.

## Consequences

The core flow is reproducible and works offline. Model quality can improve for
fuzzy language, but provider responses require separate evaluation and must not
be treated as accounting or legal advice.
