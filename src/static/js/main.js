document.addEventListener('DOMContentLoaded', function() {
    // Función para obtener cookies
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    // Función para actualizar fecha y hora
    function actualizarFechaHora() {
        const fechaElement = document.getElementById('current-date');
        const horaElement = document.getElementById('current-time');
        
        if (fechaElement || horaElement) {
            const ahora = new Date();
            
            if (fechaElement) {
                const opcionesFecha = { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                };
                fechaElement.textContent = ahora.toLocaleDateString('es-ES', opcionesFecha);
            }
            
            if (horaElement) {
                const opcionesHora = {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                };
                horaElement.textContent = ahora.toLocaleTimeString('es-ES', opcionesHora);
            }
        }
    }

    // Función para cargar datos del usuario
    function cargarDatosUsuario() {
        const sidebarAvatar = document.getElementById('sidebar-user-avatar');
        const headerAvatar = document.getElementById('header-user-avatar');
        
        const necesitaCargar = (sidebarAvatar && sidebarAvatar.classList.contains('default')) || 
                              (headerAvatar && headerAvatar.classList.contains('default'));
        
        if (necesitaCargar) {
            fetch('/main/usuario/obtener_datos_usuario')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const user = data.usuario;
                        
                        if (user.foto_usuario) {
                            const avatarUrl = `/static/images/usuario/${user.foto_usuario}`;
                            
                            const sidebarImg = document.createElement('img');
                            sidebarImg.src = avatarUrl;
                            sidebarImg.alt = "Foto de perfil";
                            sidebarImg.onerror = function() {
                                this.style.display = 'none';
                                sidebarAvatar.innerHTML = '<i class="fas fa-user-circle"></i>';
                            };
                            
                            const headerImg = document.createElement('img');
                            headerImg.src = avatarUrl;
                            headerImg.alt = "Foto de perfil";
                            headerImg.onerror = function() {
                                this.style.display = 'none';
                                headerAvatar.innerHTML = '<i class="fas fa-user-circle"></i>';
                            };
                            
                            sidebarAvatar.innerHTML = '';
                            sidebarAvatar.appendChild(sidebarImg);
                            sidebarAvatar.classList.remove('default');
                            
                            headerAvatar.innerHTML = '';
                            headerAvatar.appendChild(headerImg);
                            headerAvatar.classList.remove('default');
                        }
                        
                        const sidebarUsername = document.getElementById('sidebar-username');
                        const sidebarUserrole = document.getElementById('sidebar-userrole');
                        const headerUsername = document.getElementById('header-username');
                        
                        if (sidebarUsername && sidebarUsername.textContent === '') {
                            sidebarUsername.textContent = user.nombre_completo || user.usuario;
                        }
                        
                        if (sidebarUserrole && sidebarUserrole.textContent === '') {
                            sidebarUserrole.textContent = user.tipo_usuario || '';
                        }
                        
                        if (headerUsername && headerUsername.textContent === '') {
                            headerUsername.textContent = user.usuario;
                        }
                    }
                })
                .catch(error => {
                    console.error('Error al cargar datos del usuario:', error);
                });
        }
    }

    // Función para inicializar el dropdown del usuario
    function inicializarUserDropdown() {
        const userMenuBtn = document.getElementById('user-menu-btn');
        const dropdownMenu = document.getElementById('dropdown-menu');
        
        if (userMenuBtn && dropdownMenu) {
            userMenuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                if (dropdownMenu.classList.contains('active')) {
                    dropdownMenu.style.opacity = '0';
                    dropdownMenu.style.visibility = 'hidden';
                    dropdownMenu.style.transform = 'translateY(-10px)';
                    dropdownMenu.classList.remove('active');
                } else {
                    dropdownMenu.style.opacity = '1';
                    dropdownMenu.style.visibility = 'visible';
                    dropdownMenu.style.transform = 'translateY(0)';
                    dropdownMenu.classList.add('active');
                }
            });

            document.addEventListener('click', function(e) {
                if (!dropdownMenu.contains(e.target) && !userMenuBtn.contains(e.target)) {
                    dropdownMenu.style.opacity = '0';
                    dropdownMenu.style.visibility = 'hidden';
                    dropdownMenu.style.transform = 'translateY(-10px)';
                    dropdownMenu.classList.remove('active');
                }
            });
        }
    }

    // Función para inicializar los submenús de reportes
    function inicializarSubmenusReportes() {
        const reportesLinks = document.querySelectorAll('.reportes-link');
        
        reportesLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const submenu = this.nextElementSibling;
                const isVisible = submenu.classList.contains('show');
                
                // Cerrar otros submenús de reportes
                document.querySelectorAll('.reportes-submenu').forEach(sm => {
                    if (sm !== submenu) {
                        sm.classList.remove('show');
                        const prevLink = sm.previousElementSibling;
                        if (prevLink && prevLink.classList.contains('reportes-link')) {
                            prevLink.classList.remove('active');
                            const arrow = prevLink.querySelector('.fa-chevron-right');
                            if (arrow) arrow.style.transform = 'rotate(0deg)';
                        }
                    }
                });
                
                // Mostrar/ocultar submenu actual
                if (!isVisible) {
                    submenu.classList.add('show');
                    this.classList.add('active');
                    const arrow = this.querySelector('.fa-chevron-right');
                    if (arrow) arrow.style.transform = 'rotate(90deg)';
                } else {
                    submenu.classList.remove('show');
                    this.classList.remove('active');
                    const arrow = this.querySelector('.fa-chevron-right');
                    if (arrow) arrow.style.transform = 'rotate(0deg)';
                }
            });
        });
        
        // Cerrar submenús al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.reportes-link') && !e.target.closest('.reportes-submenu')) {
                document.querySelectorAll('.reportes-submenu').forEach(submenu => {
                    submenu.classList.remove('show');
                    const link = submenu.previousElementSibling;
                    if (link && link.classList.contains('reportes-link')) {
                        link.classList.remove('active');
                        const arrow = link.querySelector('.fa-chevron-right');
                        if (arrow) arrow.style.transform = 'rotate(0deg)';
                    }
                });
            }
        });
    }

    // Función para inicializar navegación del sidebar
    function inicializarNavegacion() {
        const navItems = document.querySelectorAll('.nav-item');
        const mainNavLinks = document.querySelectorAll('.main-nav-link');
        
        const inicioLink = document.getElementById('inicio-link');
        if (inicioLink) {
            inicioLink.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.location.pathname !== '/main/' && window.location.pathname !== '/main') {
                    window.location.href = '/main/';
                }
            });
        }
        
        mainNavLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const navItem = this.closest('.nav-item');
                const isActive = navItem.classList.contains('active');
                
                navItems.forEach(item => {
                    if (item !== navItem) {
                        item.classList.remove('active');
                    }
                });
                
                if (!isActive) {
                    navItem.classList.add('active');
                } else {
                    navItem.classList.remove('active');
                }
                
                // Cerrar submenús de reportes al cambiar de sección
                document.querySelectorAll('.reportes-submenu').forEach(submenu => {
                    submenu.classList.remove('show');
                    const link = submenu.previousElementSibling;
                    if (link && link.classList.contains('reportes-link')) {
                        link.classList.remove('active');
                        const arrow = link.querySelector('.fa-chevron-right');
                        if (arrow) arrow.style.transform = 'rotate(0deg)';
                    }
                });
            });
        });
        
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.has-submenu')) {
                navItems.forEach(item => {
                    if (!item.classList.contains('perfil-item')) {
                        item.classList.remove('active');
                    }
                });
            }
        });
        
        configurarEstadoActivoInicial();
    }
    
    // Función para configurar el estado activo inicial del menú
    function configurarEstadoActivoInicial() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        let activePage = '';
        
        const rutas = {
            '/main/': 'inicio',
            '/main': 'inicio',
            '/main/producto/gestionar_producto': 'productos',
            '/main/producto/predecir_stock': 'productos',
            '/main/producto/gestionar_cantidad': 'productos',
            '/main/reporte/reporte01': 'productos',
            '/main/reporte/reporte02': 'productos',
            '/main/reporte/reporte03': 'productos',
            '/main/almacen/gestionar_almacenes': 'almacenes',
            '/main/almacen/distribuir_almacenes': 'almacenes',
            '/main/almacen/cantidad_almacenes': 'almacenes',
            '/main/reporte/reporte04': 'almacenes',
            '/main/reporte/reporte05': 'almacenes',
            '/main/reporte/reporte06': 'almacenes',
            '/main/vehiculo/gestionar_vehiculos': 'vehiculos',
            '/main/vehiculo/gestionar_envios': 'vehiculos',
            '/main/vehiculo/planificar_rutas': 'vehiculos',
            '/main/reporte/reporte07': 'vehiculos',
            '/main/reporte/reporte08': 'vehiculos',
            '/main/reporte/reporte09': 'vehiculos',
            '/main/conductor/gestionar_conductores': 'conductores',
            '/main/conductor/gestionar_disponibilidad': 'conductores',
            '/main/conductor/asignar_vehiculo': 'conductores',
            '/main/conductor/seguimiento_envio': 'conductores',
            '/main/conductor/gestionar_estado': 'conductores',
            '/main/reporte/reporte10': 'conductores',
            '/main/reporte/reporte11': 'conductores',
            '/main/reporte/reporte12': 'conductores',
            '/main/usuario/gestionar_usuarios': 'usuarios',
            '/main/tipo_usuario/gestionar_roles': 'usuarios',
            '/main/configuracion/entrenar_modelo': 'configuracion'
        };
        
        for (const [ruta, pagina] of Object.entries(rutas)) {
            if (currentPath === ruta) {
                activePage = pagina;
                break;
            }
        }
        
        if (!activePage && !currentPath.includes('/main/usuario/usuario_perfil')) {
            if (currentPath.includes('/producto/') || currentPath.includes('/reporte/reporte0')) {
                activePage = 'productos';
            } else if (currentPath.includes('/almacen/') || currentPath.includes('/reporte/reporte1')) {
                activePage = 'almacenes';
            } else if (currentPath.includes('/vehiculo/') || currentPath.includes('/reporte/reporte2')) {
                activePage = 'vehiculos';
            } else if (currentPath.includes('/conductor/') || currentPath.includes('/reporte/reporte3')) {
                activePage = 'conductores';
            } else if (currentPath.includes('/usuario/') && !currentPath.includes('/usuario_perfil')) {
                activePage = 'usuarios';
            } else if (currentPath.includes('/configuracion/')) {
                activePage = 'configuracion';
            }
        }
        
        if (activePage && !currentPath.includes('/main/usuario/usuario_perfil')) {
            const activeItem = document.querySelector(`.nav-item[data-page="${activePage}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }
    }

    // Función para configurar menú por tipo de usuario
    function configurarMenuPorTipo() {
        const tipoNombre = getCookie('tipo_nombre') || 'CONDUCTOR';
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            let shouldDisplay = false;
            
            switch(tipoNombre) {
                case 'ADMIN':
                    shouldDisplay = true;
                    break;
                case 'DISTRIBUIDOR':
                    if (['inicio', 'productos', 'almacenes', 'vehiculos', 'conductores'].includes(page)) {
                        shouldDisplay = true;
                    }
                    break;
                case 'CONDUCTOR':
                    if (['inicio', 'vehiculos'].includes(page)) {
                        shouldDisplay = true;
                    }
                    break;
                case 'JEFE_TRANSPORTE':
                    if (['inicio', 'vehiculos', 'conductores'].includes(page)) {
                        shouldDisplay = true;
                    }
                    break;
                default:
                    shouldDisplay = true;
            }
            
            item.style.display = shouldDisplay ? 'block' : 'none';
        });
    }

    // Función para inicializar logout
    function inicializarLogout() {
        const logoutBtn = document.getElementById('header-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                cerrarSesion();
            });
        }
    }

    // Función para cerrar sesión
    function cerrarSesion() {
        const style = getComputedStyle(document.body);
        const bgSecondary = style.getPropertyValue('--bg-dropdown').trim() || '#152a3a';
        const textPrimary = style.getPropertyValue('--text-primary').trim() || '#e0f2fe';
        const accentColor = style.getPropertyValue('--accent-color').trim() || '#40e0d0';

        Swal.fire({
            title: '¿Cerrar Sesión?',
            text: '¿Estás seguro de que deseas salir del sistema?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: accentColor,
            cancelButtonColor: '#f87171',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar',
            background: bgSecondary,
            color: textPrimary,
            backdrop: 'rgba(0, 0, 0, 0.7)'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch('/login/cerrar_sesion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin'
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Error en la respuesta del servidor');
                    }
                })
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            title: 'Sesión Cerrada',
                            text: 'Has cerrado sesión exitosamente',
                            icon: 'success',
                            confirmButtonColor: accentColor,
                            background: bgSecondary,
                            color: textPrimary,
                            timer: 1500,
                            showConfirmButton: false
                        }).then(() => {
                            window.location.href = '/login';
                        });
                    } else {
                        throw new Error(data.error || 'Error desconocido');
                    }
                })
                .catch(error => {
                    console.error('Error al cerrar sesión:', error);
                    eliminarCookiesManualmente();
                });
            }
        });
    }

    // Función para eliminar cookies manualmente
    function eliminarCookiesManualmente() {
        const cookies = ['usuario', 'apellidosynombres', 'tipo', 'tipo_nombre', 'token', 'usuario_id'];
        cookies.forEach(cookie => {
            document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
        window.location.href = '/login';
    }

    // Función para inicializar el tema (Modo Claro / Modo Oscuro)
    function inicializarTema() {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (!toggleBtn) return;
        
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        actualizarIconoTema(toggleBtn, currentTheme);
        
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            actualizarIconoTema(toggleBtn, newTheme);
        });
    }
    
    function actualizarIconoTema(btn, theme) {
        const icon = btn.querySelector('i');
        if (icon) {
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    }

    // Función para generar frutas flotantes en el fondo del contenedor principal
    function generarFrutasFlotantes() {
        const container = document.getElementById('floating-fruits-container');
        if (!container) return;
        
        const fruits = ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍍', '🥝', '🥑'];
        const count = 25;
        
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const fruit = document.createElement('div');
            fruit.className = 'floating-fruit';
            fruit.innerText = fruits[Math.floor(Math.random() * fruits.length)];
            
            // Posiciones iniciales aleatorias
            fruit.style.left = `${Math.random() * 100}%`;
            fruit.style.top = `${Math.random() * 100}%`;
            
            // Tamaños aleatorios
            const size = Math.random() * 20 + 20; // de 20px a 40px
            fruit.style.fontSize = `${size}px`;
            
            // Tiempos aleatorios para la animación
            const duration = Math.random() * 30 + 30; // de 30s a 60s
            const delay = Math.random() * -60; // retraso negativo para empezar de inmediato
            
            fruit.style.animation = `floatAround ${duration}s linear infinite`;
            fruit.style.animationDelay = `${delay}s`;
            
            container.appendChild(fruit);
        }
    }

    // Función para gestionar clase al abrir/cerrar modal en Bootstrap de forma segura
    function inicializarModalesCentrados() {
        if (window.jQuery) {
            $(document).on('show.bs.modal', function () {
                document.body.classList.add('modal-active');
            });

            $(document).on('hidden.bs.modal', function () {
                if ($('.modal.show:visible').length === 0) {
                    document.body.classList.remove('modal-active');
                }
            });
        }
    }

    // Función para inicializar toda la aplicación
    function inicializarApp() {
        actualizarFechaHora();
        cargarDatosUsuario();
        inicializarUserDropdown();
        inicializarLogout();
        inicializarNavegacion();
        inicializarSubmenusReportes();
        configurarMenuPorTipo();
        inicializarTema();
        generarFrutasFlotantes();
        inicializarModalesCentrados();
        
        setInterval(actualizarFechaHora, 1000);
    }

    inicializarApp();
});