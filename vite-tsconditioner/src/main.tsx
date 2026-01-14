import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './i18n.ts';
import './index.css'
import App from './App.tsx'
import {BrowserRouter} from "react-router-dom";
import {AuthProvider} from "./auth/AuthContext.tsx";
import {AuthBinder} from "./auth/AuthBinder.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter basename="/webtimeseries">
            <AuthProvider>
                <AuthBinder>
                    <App/>
                </AuthBinder>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>,
)
