// Qué hace: Componente principal de la aplicación.
// Qué usa: Bootstrap para los estilos.
// Cómo lo hace: Por ahora solo muestra una pantalla de bienvenida; en los siguientes commits se
//     agregan el login, las rutas protegidas y los módulos.
export default function App() {
    return (
        <main className="login-screen">
            <div className="card login-card shadow-lg border-0">
                <div className="card-body p-5 text-center">
                    <div className="brand-icon"><i className="bi bi-box-seam" /></div>
                    <h1 className="h3 fw-bold">Aduana Caldera</h1>
                    <p className="text-secondary mb-0">Frontend React de la API de trámites aduanales</p>
                </div>
            </div>
        </main>
    );
}
