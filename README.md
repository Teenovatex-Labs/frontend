# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Design system: buttons

Every button shares one shape and one hover (lift 3px with a pink hard shadow). There are two weights:

| Class | Use it for |
| --- | --- |
| `.btn` (primary) | The one action a screen wants you to take: Sign up, Become a Teenovator, Send it, Give. Ink fill, cream text. |
| `.btn-secondary` | Every other action that still deserves a button: Log in, See what happens here, Back, Not now, Send another. Transparent, ink outline, fills yellow on hover. |

Modifiers (work on both):

- `.btn-sm` for compact spots such as the header, prompts and inline calls to action.
- `.btn-icon` for a square, icon-only button (the auth Back buttons).
- `.on-dark` on `.btn-secondary` when it sits on the ink background (the Donate section).

Use at most one primary per view. Text links inside sentences stay plain underlined links, and toggles or filters (chips, the donation amounts) are not buttons.
