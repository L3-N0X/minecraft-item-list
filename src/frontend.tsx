/**
 * This file is the entry point for the React app, it sets up the root
 * element and hydrates or renders the App component to the DOM.
 *
 * It is included in `index.html`.
 */

import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

const rootElement = document.getElementById('root')!

if (rootElement.firstElementChild) {
    ReactDOM.hydrateRoot(
        rootElement,
        <StrictMode>
            <App />
        </StrictMode>
    )
} else {
    ReactDOM.createRoot(rootElement).render(
        <StrictMode>
            <App />
        </StrictMode>
    )
}
