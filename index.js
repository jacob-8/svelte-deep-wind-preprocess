import MagicString from 'magic-string';
import { parse, walk } from 'svelte/compiler';

const deepName = (classes) => 'deep_' + classes.replace(/\s+/g, '_').replace(/:/g, '-');
const classNameEscapeCharacters = /([^a-zA-Z0-9_-])/g;
const escapeDisallowedCharacters = (className) => className.replace(classNameEscapeCharacters, '\\$1');
const applyCSSLinesRgx = /@apply [\s\S]+?[^}]+/g;

/**
 * @returns {import('svelte/types/compiler/preprocess').PreprocessorGroup}
 * @param {Object} options Preprocessor options
 * @param {boolean} options.rtl Support Right-To-Left languages using rtl: and ltr: prefixes
 * @param {boolean} options.globalPrefix using gl: prefix to make a class global
 */
export default ({ rtl, globalPrefix } = { rtl: false, globalPrefix: false }) => {
  return {
    markup({ content, filename }) {
      const s = new MagicString(content);

      // Skip Typescript blocks and remove @apply css lines to avoid ast parse errors
      let scriptEndIndex = 0;
      if (/lang=['"]ts['"]/.test(content)) {
        const scriptIsFirst = /^<script/;
        if (!scriptIsFirst.test(content)) { return { code: content } }
        const scriptBlocksAtBeginning = /^<script[\s\S]*<\/script>\s*/gm;
        const match = scriptBlocksAtBeginning.exec(content);
        scriptEndIndex = match[0].length;
      }
      const noTSnoApplyContent = content.slice(scriptEndIndex).replace(applyCSSLinesRgx, '');
      const ast = parse(noTSnoApplyContent);

      // Find which classes have been passed down to child components
      const deepClasses = new Set();
      walk(ast.html, {
        enter({ type, attributes }) {
          if (type === 'InlineComponent') {
            const clsAttr = attributes.find(attribute => attribute.name === 'class');
            if (clsAttr) {
              const { raw: classesStr, start, end } = clsAttr.value[0];
              deepClasses.add(classesStr);
              s.overwrite(start + scriptEndIndex, end + scriptEndIndex, deepName(classesStr))
            }
          }
        }
      })

      // Make passed down classes global (including rtl: and ltr: if turned on)
      let addedStyles = '';
      for (const clsGroup of deepClasses) {
        const clsName = `.${escapeDisallowedCharacters(deepName(clsGroup))}`;
        const classes = clsGroup.split(" ");
        const normalClasses = classes.filter((c) => {
          return c.indexOf("rtl:") === -1 && c.indexOf("ltr:") === -1;
        });
        addedStyles = addedStyles + ` :global(${clsName}) { @apply ${normalClasses.join(" ")}; }`;

        if (rtl) {
          const rtlClArr = classes.filter((c) => c.indexOf("rtl") !== -1);
          const ltrClArr = classes.filter((c) => c.indexOf("ltr") !== -1);
          if (rtlClArr.length) {
            addedStyles = addedStyles + ` :global([dir=rtl] ${clsName}) { @apply ${rtlClArr.join(" ").replace('rtl:', '')}; }`;
          }
          if (ltrClArr.length) {
            addedStyles = addedStyles + ` :global([dir=ltr] ${clsName}) { @apply ${ltrClArr.join(" ").replace('ltr:', '')}; }`;
          }
        }
      }

      // make rtl: and ltr: classes used as regular class attributes global
      if (rtl) {
        const updatedContent = s.toString().replace(applyCSSLinesRgx, '');
        const rtlMatches = updatedContent.matchAll(/rtl:[a-z0-9:()[\]-]+/g)
        const ltrMatches = updatedContent.matchAll(/ltr:[a-z0-9:()[\]-]+/g)
        const rtlClasses = new Set();
        const ltrClasses = new Set();
        for (const match of rtlMatches) {
          rtlClasses.add(match[0]);
        }
        for (const match of ltrMatches) {
          ltrClasses.add(match[0]);
        }
        for (const cls of rtlClasses) {
          addedStyles = addedStyles + ` :global([dir=rtl] .${escapeDisallowedCharacters(cls.replace('rtl:', 'rtl_'))}) { @apply ${cls.replace('rtl:', '')}; }`;
        }
        for (const cls of ltrClasses) {
          addedStyles = addedStyles + ` :global([dir=ltr] .${escapeDisallowedCharacters(cls.replace('ltr:', 'ltr_'))}) { @apply ${cls.replace('ltr:', '')}; }`;
        }
      }
      
      // make gl: prefixed classes global
      if (globalPrefix) {
        const updatedContent = s.toString().replace(applyCSSLinesRgx, '');
        const globalMatches = updatedContent.matchAll(/gl:[a-z0-9:()[\]-]+/g)
        const globalClasses = new Set();
        for (const match of globalMatches) {
          globalClasses.add(match[0]);
        }
        for (const cls of globalClasses) {
          addedStyles = addedStyles + ` :global(${escapeDisallowedCharacters(cls.replace('gl:', 'gl_'))}) { @apply ${cls.replace('gl:', '')}; }`;
        }
      }

      if (addedStyles) {
        if (ast.css == null) {
          s.append('<style>' + addedStyles + '</style>');
        } else {
          s.appendLeft(ast.css.content.start + scriptEndIndex, addedStyles);
        }
      }

      let code = s.toString();
      if (rtl) {
        // change names to keep svelte-windi-preprocess from recognizing them
        code = code.replace(/ltr:/g, 'ltr_').replace(/rtl:/g, 'rtl_');
      }
      if (globalPrefix) {
        code = code.replace(/gl:/g, 'gl_');
      }

      return {
        code,
        map: s.generateMap({ hires: true, file: filename })
      }
    }
  }
}

// export { default as logFile } from './logFile';