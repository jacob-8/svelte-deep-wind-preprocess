# Svelte Deep Wind Preprocessor

Converts a Svelte file containing a child component with class names like this:

```svelte
<script>
  import Button from './Button.svelte';
</script>
<Button class="text-yellow-500 text-lg">
  Yellow
</Button>
```

Into this:

```svelte
<script>
  import Button from './Button.svelte';
</script>
<Button class="deep_text-yellow-500_text-lg">
      Yellow
</Button>
<style> 
  :global(.deep_text-yellow-500) { @apply text-yellow-500 text-lg; }
</style>
```

This will allow you to pass Windi CSS classes to children Svelte components. When run before `svelte-windicss-preprocess` this will allow you to continue using component scoped styles, but now in a deep manner to pass to child components. *It was not intended for this but it would also allow you to use Tailwind classes arbitrarily on children components without any of those styles contributing to your sitewide stylesheet size.*

## How to use with `svelte-windicss-preprocess`
- install `npm i -D svelte-deep-wind-preprocess`
- `import deepWind from "svelte-deep-wind-preprocess";` and add `deepWind()` to your preprocessor array in `svelte.config.js` before `svelte-windicss-preprocess` runs.
- in Typescript situations due to markup being handed to this preprocessor before types are removed, we can't build an AST from the content without first stripping out the script block(s)

## Optional RTL support
- Pass `{rtl: true}` as the first argument to the preprocessor to turn on RTL support, for example: `deepWind({rtl: true})`. This will cause the preprocessor to handle `rtl:____` and `ltr:____` classes because they don't work without being placed inside `:global()` styles if your `dir="rtl"` attribute is outside of the component at hand (almost always because you place this close to your document body). Note that important `!` prefixes in these classes should be placed after the direction prefix, e.g. `rtl:!-translate-x-full`. *Don't @apply rtl:/ltr: styles inside your <style> block as they will be renamed and not work*

## ~~Optional Global Prefix~~
- ~~Pass `{globalPrefix: true}` as the first argument to cause the preprocessor to handle `global:____` classes by not scoping them if they are ones that won't work without being placed inside `:global()` styles (`.space-x-1` for example which being used to space out child components). Pass `{rtl: true, globalPrefix: true}` if turning on both options. *Don't use this prefix in classes that you @apply inside style blocks*~~
- this one needs rethought as a portion of the `.space-x-1` classes are still scoped thus making it not work

## Why not just use `windi:global`?
If you use the [`windi:global` style tag attribute](https://windicss.org/integrations/svelte.html#windi-css-classes)  you can pass classes into children components just fine, but be aware that your ability to use media query styles for that css utility is now ruined. For example if your sidebar uses `hidden md:block` to hide a button on mobile but show on larger screens and then you pass `hidden sm:inline` to a Button componenet in your header, you will have a problem if the styles from the header get added to the DOM after those from the sidebar. The reason is that media query styles don't have greater specificity. The class that gets defined last, wins. In this case the global `hidden` class from the header will override the expected behavior of `md:block` in your sidebar and your content will be hidden on all screen sizes. *This will at first seem odd to you as it can never be a problem in a situation where all utility styles are defined in one master css file as Tailwind/Windicss automatically put media query styles after normal styles, ranking from smallest screen to largest. This problem only shows up if you have global styles defined in multiple stylesheets.*

## Limitations
- Only modifies a file when script block comes first. This could easily be overcome by better logic that cuts script block out of any location properly. **The preprocessor is well tested with Vitest and PRs are welcome.** :)
- Doesn't work if running right after MDSvex. I logged out the content before and after both preprocessors ran but still don't know why.

## To Publish
`pnpm publish`