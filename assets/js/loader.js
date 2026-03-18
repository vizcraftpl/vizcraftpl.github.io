// ============================================================
// LOADER
// Depends on: state.js (DATA_FOLDER), utils.js (mergeDeep)
// ============================================================

/**
 * Fetches data/settings.yaml first.
 * settings.yaml must contain: data_files: [experience.yaml, ...]
 * Fetches all listed files, deep-merges everything into one object.
 */
async function loadAllYAML() {
  const settingsRes  = await fetch(`${DATA_FOLDER}/settings.yaml`);
  const settingsText = await settingsRes.text();
  const settings     = jsyaml.load(settingsText);

  const files = (settings.data_files || []).map(f => `${DATA_FOLDER}/${f}`);

  const parts = await Promise.all(
    files.map(async url => {
      const res  = await fetch(url);
      const text = await res.text();
      return jsyaml.load(text) || {};
    })
  );

  return mergeDeep({ ...settings }, ...parts);
}