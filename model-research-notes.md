# Open-Weight Model Research Notes

## Verified Qwen3-30B-A3B facts

Qwen's official model card identifies **Qwen3-30B-A3B** as an Apache 2.0 licensed mixture-of-experts model with 30.5B total parameters and **3.3B activated parameters per token**. It supports a native 32,768-token context, extendable to 131,072 tokens with YaRN, and can switch between thinking and non-thinking modes. The model card names SGLang and vLLM as supported production-serving paths, alongside local runtimes including Ollama, LM Studio, MLX-LM, llama.cpp, and KTransformers.

The explicit non-thinking mode is material to LevelNext: it can avoid emitting reasoning tokens for high-volume coaching prompts, classifications, and short action suggestions while preserving an optional reasoning mode for selected structured tasks. This is a primary-source capability claim, not a production quality guarantee.

Source: https://huggingface.co/Qwen/Qwen3-30B-A3B

## Verified DeepSeek-V3-0324 facts

DeepSeek's March 2025 release notes state that **DeepSeek-V3-0324** improves reasoning performance, front-end-development skills, and tool-use capabilities. The release specifically advises using V3 with “DeepThink” disabled for non-complex reasoning tasks, and confirms that the model weights are released under the MIT Licence. These claims make it a credible high-capability open-weight candidate, but not evidence that it will meet Haiku-class end-to-end latency on LevelNext’s workloads.

Source: https://api-docs.deepseek.com/news/news250325/

## Source-access note

Mistral's official announcement URL was not reachable from the research browser at the time of review. Candidate facts for Mistral Small are therefore treated as secondary until cross-validated from its official Hugging Face model card or other accessible primary documentation.

The linked Meta GitHub model-card URL returned a 404 page during the browser verification. Llama 4 Maverick’s architecture and serving claims are therefore not used as primary evidence for the final recommendation.

## Current-model verification

Qwen's current **Qwen3.5-27B** model card confirms an Apache 2.0 licence, 27B dense parameters, a native 262,144-token context (extendable to 1,010,000 tokens), a vision encoder, and production paths through SGLang, vLLM, KTransformers, and Transformers. The card also lists local compatibility with llama.cpp, Ollama, and LM Studio. This validates it as a current and operationally realistic open-weight fast-tier candidate, subject to a benchmark on LevelNext prompts before migration.

Source: https://huggingface.co/Qwen/Qwen3.5-27B

Z.ai's GLM-5.2 release page confirms an MIT licence. The page content accessible in the research browser did not expose sufficient architecture or performance detail, so all other GLM-5.2 specifications remain subject to cross-validation against its repository and benchmark sources.

Source: https://z.ai/blog/glm-5.2

## A/B testing provider validation

The exact Qwen3-30B-A3B Fireworks model path is `accounts/fireworks/models/qwen3-30b-a3b`. Credential validation against Fireworks’ model catalogue passed, but a minimal chat-completions request returned HTTP 404 because the exact model is presented as an on-demand deployment rather than a serverless endpoint. Together AI also presents the exact Qwen3-30B-A3B model as a dedicated-endpoint deployment. Neither route is suitable for immediate request-by-request evaluation without an already-provisioned dedicated inference endpoint.

Sources: https://fireworks.ai/models/fireworks/qwen3-30b-a3b and https://www.together.ai/models/qwen3-30b-a3b

## Deployed A/B route

OpenRouter exposes the exact serverless model identifier `qwen/qwen3-30b-a3b` behind its OpenAI-compatible endpoint. A live credential check and a minimal exact-model completion both succeeded after appending Qwen’s documented `/no_think` instruction, which avoids consuming short fast-path evaluations with reasoning tokens. The LevelNext admin model-evaluator page was also rendered successfully with its side-by-side prompt form, navigation link, privacy notice, reviewer controls, and saved-evaluation section.

Source: https://openrouter.ai/qwen/qwen3-30b-a3b
