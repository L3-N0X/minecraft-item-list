import { renderToString } from 'react-dom/server'
import { ServerApp } from './App'

export function render(url = '/') {
    return renderToString(<ServerApp url={url} />)
}
