/*
    HuggingFace client singleton
    Import this singleton in the controllers. Do NOT call `new HfInference()' multiple times.
 */

const {HfInference} = require('@huggingface/inference');
const hf = new HfInference(process.env.HF_TOKEN);

module.exports = hf;