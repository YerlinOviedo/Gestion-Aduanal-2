import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles.css';
import App from './App.jsx';

// Qué hace: Se monta la aplicación de React en el div "root" del index.html.
// Qué usa: createRoot de react-dom, Bootstrap 5, Bootstrap Icons y los estilos propios.
// Cómo lo hace: Se importan primero los estilos globales y luego se dibuja <App /> dentro de
//     React.StrictMode, que avisa en desarrollo si algún componente tiene problemas.
createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
