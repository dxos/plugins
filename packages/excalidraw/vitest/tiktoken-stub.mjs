//
// Copyright 2026 DXOS.org
//

// Stub for `tiktoken/lite`, reached transitively via @dxos/plugin-testing -> @dxos/ai ->
// @anthropic-ai/tokenizer. Its WASM bundle has a top-level `await` that the dep pre-bundler cannot
// rewrap, which surfaces as an unlocatable `SyntaxError: Invalid or unexpected token`. No test here
// tokenizes, so an empty module is safe — the dxos monorepo aliases it the same way.
export {};
export default {};
