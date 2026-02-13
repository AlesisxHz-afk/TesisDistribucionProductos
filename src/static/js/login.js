// Elementos del DOM actualizados
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const togglePassword = document.getElementById('togglePassword');
const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
const registerSubmitBtn = document.getElementById('registerSubmit');
const cancelRegisterBtn = document.getElementById('cancelRegister');
const registerUsernameInput = document.getElementById('registerUsername');
const esConductorInput = document.getElementById('esConductor');
const typeRegularBtn = document.getElementById('typeRegular');
const typeConductorBtn = document.getElementById('typeConductor');
const conductorFields = document.getElementById('conductorFields');
const buscarDNIBtn = document.getElementById('buscarDNI');
const driverInfo = document.getElementById('driverInfo');
const switchButtons = document.querySelectorAll('.switch-btn');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('registerFoto');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const removePreviewBtn = previewContainer?.querySelector('.remove-preview');

// Función para mostrar mensajes de éxito
function showSuccessMessage(title, text, htmlContent = null) {
    return Swal.fire({
        title: title,
        text: htmlContent ? null : text,
        html: htmlContent || text,
        icon: 'success',
        iconColor: '#4CAF50',
        showConfirmButton: true,
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#4CAF50',
        background: '#ffffff',
        backdrop: 'rgba(76, 175, 80, 0.1)',
        customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            htmlContainer: 'custom-swal-html'
        }
    });
}

// Función para mostrar mensajes de error
function showErrorMessage(title, text, htmlContent = null) {
    return Swal.fire({
        title: title,
        text: htmlContent ? null : text,
        html: htmlContent || text,
        icon: 'error',
        iconColor: '#f44336',
        showConfirmButton: true,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#4CAF50',
        background: '#ffffff',
        backdrop: 'rgba(244, 67, 54, 0.1)',
        customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            htmlContainer: 'custom-swal-html'
        }
    });
}

// Función para mostrar mensajes de advertencia
function showWarningMessage(title, text, htmlContent = null) {
    return Swal.fire({
        title: title,
        text: htmlContent ? null : text,
        html: htmlContent || text,
        icon: 'warning',
        iconColor: '#FF9800',
        showConfirmButton: true,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#4CAF50',
        background: '#ffffff',
        backdrop: 'rgba(255, 152, 0, 0.1)',
        customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            htmlContainer: 'custom-swal-html'
        }
    });
}

// Función para mostrar mensajes de información
function showInfoMessage(title, text, htmlContent = null) {
    return Swal.fire({
        title: title,
        text: htmlContent ? null : text,
        html: htmlContent || text,
        icon: 'info',
        iconColor: '#2196F3',
        showConfirmButton: true,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#4CAF50',
        background: '#ffffff',
        backdrop: 'rgba(33, 150, 243, 0.1)',
        customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            htmlContainer: 'custom-swal-html'
        }
    });
}

// Función para mostrar loading
function showLoadingMessage(title = 'Procesando...', text = 'Por favor espera') {
    return Swal.fire({
        title: title,
        html: `
            <div style="text-align: center; padding: 20px 0;">
                <div class="swal2-spinner" style="width: 60px; height: 60px; margin: 0 auto 20px; border: 4px solid #f3f3f3; border-top: 4px solid #4CAF50; border-radius: 50%; animation: swal2-spin 1s linear infinite;"></div>
                <p style="color: #666; font-size: 14px; margin-top: 15px;">${text}</p>
            </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        backdrop: 'rgba(0, 0, 0, 0.3)',
        background: '#ffffff'
    });
}

// Función para mostrar mensaje de confirmación
function showConfirmMessage(title, text, confirmText = 'Sí, continuar', cancelText = 'Cancelar') {
    return Swal.fire({
        title: title,
        text: text,
        icon: 'question',
        iconColor: '#4CAF50',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        confirmButtonColor: '#4CAF50',
        cancelButtonColor: '#f44336',
        background: '#ffffff',
        backdrop: 'rgba(0, 0, 0, 0.3)',
        customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title'
        }
    });
}

// Cambiar entre formularios con botones superiores
switchButtons.forEach(button => {
    button.addEventListener('click', function() {
        const formToShow = this.getAttribute('data-form');
        
        // Actualizar botones activos
        switchButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Mostrar formulario correspondiente
        showForm(`${formToShow}Form`);
    });
});

// Mostrar formulario específico
function showForm(formId) {
    document.querySelectorAll('.form-wrapper').forEach(form => {
        form.classList.remove('active');
    });
    
    const formElement = document.getElementById(formId);
    if (formElement) {
        formElement.classList.add('active');
    }
    
    // Limpiar campos al cambiar de formulario
    if (formId === 'loginForm') {
        loginFormElement.reset();
    }
}

// Resetear formulario de registro
function resetRegisterForm() {
    if (registerFormElement) {
        registerFormElement.reset();
    }
    
    esConductorInput.value = "false";
    
    // Resetear tipo de usuario
    if (typeRegularBtn && typeConductorBtn) {
        typeRegularBtn.classList.add('active');
        typeConductorBtn.classList.remove('active');
    }
    
    // Ocultar campos de conductor
    if (conductorFields) conductorFields.style.display = 'none';
    if (driverInfo) driverInfo.style.display = 'none';
    if (previewContainer) previewContainer.style.display = 'none';
    
    // Habilitar campos de nombres
    const nombres = document.getElementById('registerNombres');
    const paterno = document.getElementById('registerPaterno');
    const materno = document.getElementById('registerMaterno');
    
    if (nombres && paterno && materno) {
        nombres.disabled = false;
        paterno.disabled = false;
        materno.disabled = false;
        nombres.readOnly = false;
        paterno.readOnly = false;
        materno.readOnly = false;
        nombres.value = '';
        paterno.value = '';
        materno.value = '';
    }
    
    // Limpiar DNI
    const dniInput = document.getElementById('registerDNI');
    if (dniInput) dniInput.value = '';
    
    // Actualizar botones superiores
    if (switchButtons.length >= 2) {
        switchButtons[0].classList.add('active');
        switchButtons[1].classList.remove('active');
    }
}

// Configurar mostrar/ocultar contraseña
function setupPasswordToggle() {
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            if (passwordInput && icon) {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
    
    if (toggleRegisterPassword) {
        toggleRegisterPassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('registerPassword');
            const icon = this.querySelector('i');
            if (passwordInput && icon) {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
}

// Función para verificar si un usuario ya existe
async function verificarUsuarioBackend(username) {
    try {
        const response = await fetch(`/usuario/verificar_usuario/${username}`);
        const data = await response.json();
        
        if (data.existe) {
            showWarningMessage(
                'Usuario No Disponible',
                null,
                `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #FFF3E0 0%, #FFECB3 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #FF9800;">
                        <i class="fas fa-user-times" style="font-size: 40px; color: #FF9800;"></i>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">¡Nombre de Usuario Ocupado!</h3>
                    <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                        El usuario <strong style="color: #FF9800; font-weight: 700;">"${username}"</strong> ya está registrado en el sistema.
                    </p>
                    <p style="color: #888; font-size: 13px; margin-bottom: 20px;">
                        Por favor, elige un nombre de usuario diferente.
                    </p>
                </div>
                `
            );
            
            if (registerUsernameInput) {
                registerUsernameInput.classList.add('shake');
                setTimeout(() => {
                    registerUsernameInput.classList.remove('shake');
                }, 600);
            }
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error al verificar usuario:', error);
        return true;
    }
}

// Seleccionar tipo de usuario
function setupUserTypeSelection() {
    if (typeRegularBtn) {
        typeRegularBtn.addEventListener('click', function() {
            esConductorInput.value = "false";
            typeRegularBtn.classList.add('active');
            if (typeConductorBtn) typeConductorBtn.classList.remove('active');
            if (conductorFields) conductorFields.style.display = 'none';
            
            // Habilitar campos de nombres
            const nombres = document.getElementById('registerNombres');
            const paterno = document.getElementById('registerPaterno');
            const materno = document.getElementById('registerMaterno');
            
            if (nombres && paterno && materno) {
                nombres.disabled = false;
                paterno.disabled = false;
                materno.disabled = false;
                nombres.readOnly = false;
                paterno.readOnly = false;
                materno.readOnly = false;
            }
            
            // Limpiar DNI
            const dniInput = document.getElementById('registerDNI');
            if (dniInput) dniInput.value = '';
            if (driverInfo) driverInfo.style.display = 'none';
        });
    }
    
    if (typeConductorBtn) {
        typeConductorBtn.addEventListener('click', function() {
            esConductorInput.value = "true";
            if (typeRegularBtn) typeRegularBtn.classList.remove('active');
            typeConductorBtn.classList.add('active');
            if (conductorFields) conductorFields.style.display = 'block';
            
            // Deshabilitar campos de nombres hasta buscar DNI
            const nombres = document.getElementById('registerNombres');
            const paterno = document.getElementById('registerPaterno');
            const materno = document.getElementById('registerMaterno');
            
            if (nombres && paterno && materno) {
                nombres.disabled = true;
                paterno.disabled = true;
                materno.disabled = true;
                nombres.value = '';
                paterno.value = '';
                materno.value = '';
            }
            
            if (driverInfo) driverInfo.style.display = 'none';
        });
    }
}

// Buscar conductor por DNI
async function buscarConductor() {
    const dniInput = document.getElementById('registerDNI');
    if (!dniInput) return;
    
    const dni = dniInput.value.trim();
    
    if (!dni || dni.length !== 8 || isNaN(dni)) {
        showErrorMessage(
            'DNI Inválido',
            null,
            `
            <div style="text-align: center; padding: 20px 0;">
                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #f44336;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 30px; color: #f44336;"></i>
                </div>
                <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Formato de DNI Incorrecto</h3>
                <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                    El DNI debe contener <strong style="color: #f44336;">exactamente 8 dígitos numéricos</strong>.
                </p>
                <div style="background: #F5F5F5; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4CAF50;">
                    <p style="color: #666; margin: 0; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-lightbulb" style="color: #FF9800;"></i>
                        <span>Ejemplo de formato válido: <strong>12345678</strong></span>
                    </p>
                </div>
            </div>
            `
        );
        
        dniInput.classList.add('shake');
        setTimeout(() => dniInput.classList.remove('shake'), 600);
        return;
    }
    
    const swalLoading = showLoadingMessage('Verificando conductor', 'Buscando en nuestra base de datos...');
    
    try {
        const response = await fetch(`/usuario/verificar_conductor/${dni}`);
        const data = await response.json();
        
        Swal.close();
        
        if (!data.existe) {
            showInfoMessage(
                'Conductor No Encontrado',
                null,
                `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #2196F3;">
                        <i class="fas fa-search" style="font-size: 30px; color: #2196F3;"></i>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Conductor No Registrado</h3>
                    <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                        El DNI <strong style="color: #2196F3;">${dni}</strong> no se encuentra en nuestra base de datos de conductores.
                    </p>
                    <div style="background: #F5F5F5; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2196F3;">
                        <p style="color: #666; margin: 0; font-size: 13px;">
                            <i class="fas fa-info-circle" style="color: #2196F3; margin-right: 8px;"></i>
                            Solo los conductores registrados previamente pueden crear una cuenta como conductor.
                        </p>
                    </div>
                </div>
                `
            );
            return;
        }
        
        const conductor = data.conductor;
        
        if (!data.puede_registrarse) {
            if (conductor.estado !== "ACTIVO") {
                showWarningMessage(
                    'Conductor Inactivo',
                    null,
                    `
                    <div style="text-align: center; padding: 20px 0;">
                        <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #FFF3E0 0%, #FFECB3 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #FF9800;">
                            <i class="fas fa-user-clock" style="font-size: 30px; color: #FF9800;"></i>
                        </div>
                        <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Estado Inactivo</h3>
                        <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                            El conductor <strong>${conductor.nombre} ${conductor.paterno}</strong> se encuentra actualmente <span style="color: #FF9800; font-weight: 600;">INACTIVO</span> en el sistema.
                        </p>
                        <div style="background: #FFF3E0; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FF9800;">
                            <p style="color: #666; margin: 0; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-exclamation-circle" style="color: #FF9800;"></i>
                                <span>Para activar el conductor, contacta al administrador del sistema.</span>
                            </p>
                        </div>
                    </div>
                    `
                );
            } else if (data.tiene_usuario) {
                showErrorMessage(
                    'Cuenta Ya Existente',
                    null,
                    `
                    <div style="text-align: center; padding: 20px 0;">
                        <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #f44336;">
                            <i class="fas fa-user-slash" style="font-size: 30px; color: #f44336;"></i>
                        </div>
                        <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Cuenta Asignada</h3>
                        <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                            El conductor <strong>${conductor.nombre} ${conductor.paterno}</strong> ya tiene una cuenta de usuario asignada.
                        </p>
                        <div style="background: #FFEBEE; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f44336;">
                            <p style="color: #666; margin: 0; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-sign-in-alt" style="color: #f44336;"></i>
                                <span>Si ya tienes una cuenta, puedes iniciar sesión directamente.</span>
                            </p>
                        </div>
                    </div>
                    `
                ).then(() => {
                    showForm('loginForm');
                });
            }
            return;
        }
        
        // Conductor encontrado y disponible
        const nombres = document.getElementById('registerNombres');
        const paterno = document.getElementById('registerPaterno');
        const materno = document.getElementById('registerMaterno');
        
        if (nombres && paterno && materno) {
            nombres.value = conductor.nombre;
            paterno.value = conductor.paterno;
            materno.value = conductor.materno;
            nombres.disabled = false;
            paterno.disabled = false;
            materno.disabled = false;
            nombres.readOnly = true;
            paterno.readOnly = true;
            materno.readOnly = true;
        }
        
        // Mostrar información del conductor
        const driverFullName = document.getElementById('driverFullName');
        const driverStatus = document.getElementById('driverStatus');
        
        if (driverFullName && driverStatus) {
            driverFullName.textContent = `${conductor.nombre} ${conductor.paterno} ${conductor.materno}`;
            driverStatus.textContent = conductor.estado;
            driverInfo.style.display = 'block';
        }
        
        showSuccessMessage(
            '¡Conductor Verificado!',
            null,
            `
            <div style="text-align: center; padding: 20px 0;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #4CAF50;">
                    <i class="fas fa-user-check" style="font-size: 35px; color: #4CAF50;"></i>
                </div>
                <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">¡Verificación Exitosa!</h3>
                <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                    El conductor ha sido verificado correctamente en nuestro sistema.
                </p>
                <div style="background: #E8F5E9; padding: 15px; border-radius: 10px; margin: 20px 0; text-align: left; border: 1px solid #C8E6C9;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <i class="fas fa-id-card" style="color: #4CAF50;"></i>
                        <span style="color: #666; font-size: 13px;">DNI:</span>
                        <strong style="color: #333;">${dni}</strong>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <i class="fas fa-user" style="color: #4CAF50;"></i>
                        <span style="color: #666; font-size: 13px;">Nombre:</span>
                        <strong style="color: #333;">${conductor.nombre} ${conductor.paterno} ${conductor.materno}</strong>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-circle" style="color: #4CAF50; font-size: 12px;"></i>
                        <span style="color: #666; font-size: 13px;">Estado:</span>
                        <span style="color: #4CAF50; font-weight: 600;">${conductor.estado}</span>
                    </div>
                </div>
                <p style="color: #888; font-size: 13px; margin-top: 15px;">
                    Puedes continuar completando el formulario de registro.
                </p>
            </div>
            `
        );
        
    } catch (error) {
        console.error('Error al buscar conductor:', error);
        showErrorMessage(
            'Error de Conexión',
            null,
            `
            <div style="text-align: center; padding: 20px 0;">
                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #f44336;">
                    <i class="fas fa-wifi-slash" style="font-size: 30px; color: #f44336;"></i>
                </div>
                <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Error de Conexión</h3>
                <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                    No se pudo verificar el conductor en este momento.
                </p>
                <div style="background: #F5F5F5; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f44336;">
                    <p style="color: #666; margin: 0; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-sync-alt" style="color: #f44336;"></i>
                        <span>Por favor, verifica tu conexión a internet e intenta nuevamente.</span>
                    </p>
                </div>
            </div>
            `
        );
    }
}

// Manejar subida de imágenes
function setupImageUpload() {
    if (!uploadArea || !fileInput) return;
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.background = 'rgba(76, 175, 80, 0.15)';
        uploadArea.style.borderColor = '#2E7D32';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.background = 'rgba(76, 175, 80, 0.05)';
        uploadArea.style.borderColor = '#4CAF50';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.background = 'rgba(76, 175, 80, 0.05)';
        uploadArea.style.borderColor = '#4CAF50';
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleImagePreview();
        }
    });
    
    fileInput.addEventListener('change', handleImagePreview);
    
    if (removePreviewBtn) {
        removePreviewBtn.addEventListener('click', () => {
            if (previewContainer) previewContainer.style.display = 'none';
            fileInput.value = '';
        });
    }
}

function handleImagePreview() {
    const file = fileInput.files[0];
    if (!file || !imagePreview || !previewContainer) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showErrorMessage(
            'Archivo Demasiado Grande',
            null,
            `
            <div style="text-align: center; padding: 20px 0;">
                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #f44336;">
                    <i class="fas fa-weight-hanging" style="font-size: 30px; color: #f44336;"></i>
                </div>
                <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Límite de Tamaño Excedido</h3>
                <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                    La imagen seleccionada supera el tamaño máximo permitido de <strong style="color: #f44336;">5 MB</strong>.
                </p>
                <div style="background: #F5F5F5; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f44336;">
                    <p style="color: #666; margin: 0; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-compress-alt" style="color: #f44336;"></i>
                        <span>Por favor, comprime la imagen o selecciona una más pequeña.</span>
                    </p>
                </div>
            </div>
            `
        );
        fileInput.value = '';
        return;
    }
    
    if (!file.type.match('image.*')) {
        showErrorMessage(
            'Formato de Archivo Inválido',
            null,
            `
            <div style="text-align: center; padding: 20px 0;">
                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #f44336;">
                    <i class="fas fa-file-excel" style="font-size: 30px; color: #f44336;"></i>
                </div>
                <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Tipo de Archivo No Soportado</h3>
                <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                    Solo se permiten archivos de imagen (JPG, PNG, GIF, etc.).
                </p>
                <div style="background: #F5F5F5; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f44336;">
                    <p style="color: #666; margin: 0; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-images" style="color: #f44336;"></i>
                        <span>Formatos aceptados: JPG, JPEG, PNG, GIF, WebP</span>
                    </p>
                </div>
            </div>
            `
        );
        fileInput.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Manejar envío del formulario de login
if (loginFormElement) {
    loginFormElement.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showWarningMessage(
                'Campos Incompletos',
                null,
                `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #FFF3E0 0%, #FFECB3 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #FF9800;">
                        <i class="fas fa-exclamation-circle" style="font-size: 30px; color: #FF9800;"></i>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Información Requerida</h3>
                    <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                        Por favor, completa todos los campos obligatorios para continuar.
                    </p>
                    <div style="background: #FFF3E0; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FF9800;">
                        <p style="color: #666; margin: 0; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-edit" style="color: #FF9800;"></i>
                            <span>Ambos campos son necesarios para iniciar sesión.</span>
                        </p>
                    </div>
                </div>
                `
            );
            return;
        }
        
        const swalLoading = showLoadingMessage('Iniciando Sesión', 'Verificando tus credenciales...');
        
        const formData = new FormData(this);
        
        fetch('/login/procesar_login', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.redirected) {
                Swal.close();
                showSuccessMessage(
                    '¡Bienvenido al Sistema!',
                    null,
                    `
                    <div style="text-align: center; padding: 20px 0;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #4CAF50;">
                            <i class="fas fa-check-circle" style="font-size: 35px; color: #4CAF50;"></i>
                        </div>
                        <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">¡Acceso Exitoso!</h3>
                        <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                            Bienvenido de nuevo, <strong style="color: #4CAF50;">${username}</strong>.
                        </p>
                        <div style="background: #E8F5E9; padding: 15px; border-radius: 10px; margin: 20px 0; border: 1px solid #C8E6C9;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 8px;">
                                <i class="fas fa-spinner fa-spin" style="color: #4CAF50;"></i>
                                <span style="color: #666; font-size: 14px;">Redirigiendo al sistema...</span>
                            </div>
                            <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
                                Serás redirigido automáticamente en unos segundos.
                            </p>
                        </div>
                    </div>
                    `
                ).then(() => {
                    window.location.href = response.url;
                });
            } else if (response.status === 401) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Credenciales incorrectas');
                });
            } else {
                throw new Error('Error en el servidor');
            }
        })
        .catch(error => {
            Swal.close();
            showErrorMessage(
                'Error de Autenticación',
                null,
                `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #f44336;">
                        <i class="fas fa-lock" style="font-size: 30px; color: #f44336;"></i>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Credenciales Incorrectas</h3>
                    <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                        El nombre de usuario o contraseña que ingresaste no son válidos.
                    </p>
                    <div style="background: #FFEBEE; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f44336;">
                        <div style="color: #666; font-size: 13px;">
                            <p style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-user" style="color: #f44336;"></i>
                                <span>Verifica tu nombre de usuario</span>
                            </p>
                            <p style="margin: 0; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-key" style="color: #f44336;"></i>
                                <span>Verifica tu contraseña</span>
                            </p>
                        </div>
                    </div>
                    <div style="background: #F5F5F5; padding: 12px; border-radius: 8px; margin-top: 15px; border: 1px dashed #ddd;">
                        <p style="color: #666; margin: 0; font-size: 12px; text-align: center;">
                            <i class="fas fa-question-circle" style="color: #4CAF50; margin-right: 5px;"></i>
                            ¿Olvidaste tu contraseña? Contacta al administrador del sistema.
                        </p>
                    </div>
                </div>
                `
            );
        });
    });
}

// Manejar envío del formulario de registro
if (registerFormElement) {
    registerFormElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const nombres = document.getElementById('registerNombres').value.trim();
        const paterno = document.getElementById('registerPaterno').value.trim();
        const materno = document.getElementById('registerMaterno').value.trim();
        const foto = document.getElementById('registerFoto').files[0];
        const esConductor = esConductorInput.value === "true";
        const dni = document.getElementById('registerDNI').value.trim();
        
        // Validaciones básicas
        if (!username || !password || !nombres || !paterno || !materno) {
            showWarningMessage(
                'Campos Obligatorios',
                null,
                `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #FFF3E0 0%, #FFECB3 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #FF9800;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 30px; color: #FF9800;"></i>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Información Incompleta</h3>
                    <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                        Por favor, completa todos los campos obligatorios marcados con <span style="color: #f44336; font-weight: 600;">*</span>.
                    </p>
                    <div style="background: #FFF3E0; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FF9800;">
                        <div style="color: #666; font-size: 13px;">
                            <p style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-user-circle" style="color: #FF9800;"></i>
                                <span>Nombre de usuario y contraseña</span>
                            </p>
                            <p style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-id-card" style="color: #FF9800;"></i>
                                <span>Nombres completos (Nombres, Apellido Paterno, Apellido Materno)</span>
                            </p>
                            <p style="margin: 0; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-truck" style="color: #FF9800;"></i>
                                <span>${esConductor ? 'DNI del conductor' : 'Información personal completa'}</span>
                            </p>
                        </div>
                    </div>
                </div>
                `
            );
            return;
        }
        
        if (password.length < 6) {
            showWarningMessage(
                'Contraseña Muy Corta',
                null,
                `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #FFF3E0 0%, #FFECB3 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #FF9800;">
                        <i class="fas fa-shield-alt" style="font-size: 30px; color: #FF9800;"></i>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Seguridad de Contraseña</h3>
                    <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                        La contraseña debe tener un <strong style="color: #FF9800;">mínimo de 6 caracteres</strong> para mayor seguridad.
                    </p>
                    <div style="background: #FFF3E0; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FF9800;">
                        <p style="color: #666; margin: 0; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-lightbulb" style="color: #FF9800;"></i>
                            <span>Recomendación: Usa una combinación de letras, números y símbolos.</span>
                        </p>
                    </div>
                </div>
                `
            );
            return;
        }
        
        if (esConductor && !dni) {
            showWarningMessage(
                'DNI Requerido',
                null,
                `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #FFF3E0 0%, #FFECB3 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #FF9800;">
                        <i class="fas fa-id-card-alt" style="font-size: 30px; color: #FF9800;"></i>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">DNI de Conductor Obligatorio</h3>
                    <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                        Para registrarte como conductor, debes ingresar y verificar tu <strong style="color: #FF9800;">número de DNI</strong>.
                    </p>
                    <div style="background: #FFF3E0; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FF9800;">
                        <p style="color: #666; margin: 0; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-search" style="color: #FF9800;"></i>
                            <span>Haz clic en el botón "Verificar" después de ingresar tu DNI de 8 dígitos.</span>
                        </p>
                    </div>
                </div>
                `
            );
            return;
        }
        
        // Verificar si el usuario ya existe
        const usuarioValido = await verificarUsuarioBackend(username);
        if (!usuarioValido) {
            return;
        }
        
        // Deshabilitar botón para evitar múltiples envíos
        if (registerSubmitBtn) {
            registerSubmitBtn.disabled = true;
            registerSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Creando cuenta...</span>';
        }
        
        const swalLoading = showLoadingMessage('Creando Cuenta', 'Estamos procesando tu registro en el sistema...');
        
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            formData.append('nombres', nombres);
            formData.append('paterno', paterno);
            formData.append('materno', materno);
            formData.append('es_conductor', esConductor);
            if (foto) formData.append('foto', foto);
            if (esConductor) formData.append('dni', dni);
            
            const response = await fetch('/usuario/registrar', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                Swal.close();
                showSuccessMessage(
                    '¡Registro Exitoso!',
                    null,
                    `
                    <div style="text-align: center; padding: 20px 0;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #4CAF50;">
                            <i class="fas fa-user-plus" style="font-size: 35px; color: #4CAF50;"></i>
                        </div>
                        <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">¡Cuenta Creada Exitosamente!</h3>
                        <p style="color: #666; margin-bottom: 15px; line-height: 1.5;">
                            Felicitaciones <strong style="color: #4CAF50;">${username}</strong>, tu cuenta ha sido registrada correctamente en nuestro sistema.
                        </p>
                        <div style="background: #E8F5E9; padding: 15px; border-radius: 10px; margin: 20px 0; text-align: left; border: 1px solid #C8E6C9;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <i class="fas fa-user-tag" style="color: #4CAF50;"></i>
                                <span style="color: #666; font-size: 13px;">Usuario:</span>
                                <strong style="color: #333;">${username}</strong>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <i class="fas fa-user" style="color: #4CAF50;"></i>
                                <span style="color: #666; font-size: 13px;">Nombre:</span>
                                <strong style="color: #333;">${nombres} ${paterno} ${materno}</strong>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-user-tie" style="color: #4CAF50;"></i>
                                <span style="color: #666; font-size: 13px;">Tipo:</span>
                                <strong style="color: #333;">${esConductor ? 'Conductor' : 'Usuario Regular'}</strong>
                            </div>
                        </div>
                        <div style="background: #FFF3E0; padding: 12px; border-radius: 8px; margin: 20px 0; border: 1px dashed #FF9800;">
                            <p style="color: #666; margin: 0; font-size: 12px; text-align: center;">
                                <i class="fas fa-info-circle" style="color: #FF9800; margin-right: 5px;"></i>
                                Ahora puedes iniciar sesión con tus credenciales.
                            </p>
                        </div>
                    </div>
                    `
                ).then(() => {
                    showForm('loginForm');
                    resetRegisterForm();
                });
            } else {
                throw new Error(data.error || 'Error en el registro');
            }
        } catch (error) {
            Swal.close();
            showErrorMessage(
                'Error en el Registro',
                null,
                `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 2px solid #f44336;">
                        <i class="fas fa-times-circle" style="font-size: 30px; color: #f44336;"></i>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Error al Crear la Cuenta</h3>
                    <p style="color: #666; margin-bottom: 10px; line-height: 1.5;">
                        ${error.message || 'Hubo un problema al procesar tu registro.'}
                    </p>
                    <div style="background: #FFEBEE; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f44336;">
                        <div style="color: #666; font-size: 13px;">
                            <p style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-redo" style="color: #f44336;"></i>
                                <span>Por favor, intenta nuevamente en unos momentos.</span>
                            </p>
                            <p style="margin: 0; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-headset" style="color: #f44336;"></i>
                                <span>Si el problema persiste, contacta al soporte técnico.</span>
                            </p>
                        </div>
                    </div>
                </div>
                `
            );
        } finally {
            if (registerSubmitBtn) {
                registerSubmitBtn.disabled = false;
                registerSubmitBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Crear cuenta</span>';
            }
        }
    });
}

// Inicializar la aplicación
function init() {
    setupPasswordToggle();
    setupUserTypeSelection();
    setupImageUpload();
    showForm('loginForm');
    
    // Event listeners
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            resetRegisterForm();
            showForm('registerForm');
            // Actualizar botones superiores
            if (switchButtons.length >= 2) {
                switchButtons[0].classList.remove('active');
                switchButtons[1].classList.add('active');
            }
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            showForm('loginForm');
            // Actualizar botones superiores
            if (switchButtons.length >= 2) {
                switchButtons[0].classList.add('active');
                switchButtons[1].classList.remove('active');
            }
        });
    }
    
    if (cancelRegisterBtn) {
        cancelRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showConfirmMessage(
                '¿Cancelar Registro?',
                'Se perderán todos los datos que hayas ingresado en el formulario.',
                'Sí, cancelar registro',
                'Continuar registrando'
            ).then((result) => {
                if (result.isConfirmed) {
                    showForm('loginForm');
                    resetRegisterForm();
                }
            });
        });
    }
    
    if (buscarDNIBtn) {
        buscarDNIBtn.addEventListener('click', buscarConductor);
    }
    
    // Validar usuario cuando pierde el foco
    if (registerUsernameInput) {
        registerUsernameInput.addEventListener('blur', async function() {
            if (this.value.trim().length >= 3) {
                await verificarUsuarioBackend(this.value.trim());
            }
        });
    }
    
    const dniInput = document.getElementById('registerDNI');
    if (dniInput) {
        dniInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarConductor();
            }
        });
    }
    
    // Agregar estilos de animación para spinner
    const style = document.createElement('style');
    style.textContent = `
        @keyframes swal2-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .custom-swal-popup {
            border-radius: 15px !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
            border: 1px solid rgba(0, 0, 0, 0.05) !important;
            overflow: hidden !important;
        }
        
        .custom-swal-title {
            font-family: 'Montserrat', sans-serif !important;
            font-weight: 700 !important;
            color: #333 !important;
            font-size: 20px !important;
            margin-bottom: 10px !important;
        }
        
        .custom-swal-html {
            font-family: 'Poppins', sans-serif !important;
            color: #666 !important;
            line-height: 1.5 !important;
        }
        
        .swal2-confirm {
            border-radius: 10px !important;
            padding: 10px 30px !important;
            font-weight: 600 !important;
            font-size: 14px !important;
            transition: all 0.3s ease !important;
        }
        
        .swal2-confirm:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3) !important;
        }
        
        .swal2-cancel {
            border-radius: 10px !important;
            padding: 10px 30px !important;
            font-weight: 600 !important;
            font-size: 14px !important;
            transition: all 0.3s ease !important;
        }
    `;
    document.head.appendChild(style);
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', init);