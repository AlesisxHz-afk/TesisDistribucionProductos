/**
 * Script para la gestión del perfil de usuario simplificado
 */

let usuarioData = null;
let originalData = null;
let isTakingPhoto = false;

document.addEventListener('DOMContentLoaded', function() {
    cargarDatosUsuario();
    inicializarEventos();
});

function cargarDatosUsuario() {
    // Si los datos ya fueron inyectados por el servidor (Jinja), usarlos directamente
    if (typeof serverUsuarioData !== 'undefined' && serverUsuarioData && serverUsuarioData.usuario) {
        usuarioData = serverUsuarioData;
        if (usuarioData.estado_usuario === 'True' || usuarioData.estado_usuario === 'true') {
            usuarioData.estado_usuario = true;
        } else if (usuarioData.estado_usuario === 'False' || usuarioData.estado_usuario === 'false') {
            usuarioData.estado_usuario = false;
        }
        originalData = JSON.parse(JSON.stringify(usuarioData));
        mostrarDatosUsuario();
        return;
    }

    fetch('/main/usuario/obtener_datos_usuario')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                usuarioData = data.usuario;
                originalData = JSON.parse(JSON.stringify(usuarioData));
                mostrarDatosUsuario();
                
                // Actualizar sidebar
                document.getElementById('usernameDisplay').textContent = usuarioData.usuario;
                document.getElementById('roleDisplay').textContent = usuarioData.tipo_usuario;
                document.getElementById('statusDisplay').textContent = 
                    usuarioData.estado_usuario === true || usuarioData.estado_usuario === 'true' || usuarioData.estado_usuario === 'ACTIVO' 
                    ? 'Activo' : 'Inactivo';
                    
                // Actualizar foto de perfil si existe
                if (usuarioData.foto_usuario) {
                    const fotoUrl = `/static/images/usuario/${usuarioData.foto_usuario}?t=${new Date().getTime()}`;
                    document.getElementById('profilePhoto').src = fotoUrl;
                }
            } else {
                showSwalError('Error al cargar datos del usuario');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showSwalError('Error al conectar con el servidor');
        });
}

function mostrarDatosUsuario() {
    if (!usuarioData) return;
    
    // Mostrar datos en el formulario
    document.getElementById('usuario').value = usuarioData.usuario || '';
    document.getElementById('nombres').value = usuarioData.nombres || '';
    document.getElementById('ape_paterno').value = usuarioData.ape_paterno || '';
    document.getElementById('ape_materno').value = usuarioData.ape_materno || '';
}

function inicializarEventos() {
    // Formulario de perfil unificado
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', guardarPerfil);
    
    // Validación en tiempo real
    document.getElementById('nombres').addEventListener('input', validarCampo);
    document.getElementById('ape_paterno').addEventListener('input', validarCampo);
    document.getElementById('ape_materno').addEventListener('input', validarCampo);
    
    // Validación de contraseñas en tiempo real
    document.getElementById('new_password').addEventListener('input', validarPasswordMatch);
    document.getElementById('confirm_password').addEventListener('input', validarPasswordMatch);
    
    // Subir foto de perfil
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', subirFotoPerfil);
}

function validarCampo(e) {
    const campo = e.target;
    const valor = campo.value.trim();
    
    if (!valor) {
        campo.classList.add('is-invalid');
    } else {
        campo.classList.remove('is-invalid');
    }
}

function validarPasswordMatch() {
    const newPass = document.getElementById('new_password').value;
    const confirmPass = document.getElementById('confirm_password').value;
    const confirmInput = document.getElementById('confirm_password');
    
    // Solo validar si ambos campos tienen contenido
    if (newPass && confirmPass && newPass !== confirmPass) {
        confirmInput.classList.add('is-invalid');
        return false;
    } else {
        confirmInput.classList.remove('is-invalid');
        return true;
    }
}

function validarFormularioPerfil() {
    let valido = true;
    const campos = ['nombres', 'ape_paterno', 'ape_materno'];
    
    campos.forEach(campo => {
        const input = document.getElementById(campo);
        const valor = input.value.trim();
        
        if (!valor) {
            input.classList.add('is-invalid');
            valido = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    // Validar contraseñas si se están cambiando
    const currentPass = document.getElementById('current_password').value;
    const newPass = document.getElementById('new_password').value;
    const confirmPass = document.getElementById('confirm_password').value;
    
    if (currentPass || newPass || confirmPass) {
        if (!currentPass || !newPass || !confirmPass) {
            showSwalError('Para cambiar la contraseña, completa todos los campos de contraseña');
            return false;
        }
        
        if (newPass.length < 6) {
            showSwalError('La nueva contraseña debe tener al menos 6 caracteres');
            return false;
        }
        
        if (newPass !== confirmPass) {
            document.getElementById('confirm_password').classList.add('is-invalid');
            showSwalError('Las contraseñas no coinciden');
            return false;
        }
    }
    
    return valido;
}

async function guardarPerfil(e) {
    e.preventDefault();
    
    if (!validarFormularioPerfil()) {
        return;
    }
    
    // Verificar si hay cambios en datos personales
    const nombres = document.getElementById('nombres').value.trim();
    const paterno = document.getElementById('ape_paterno').value.trim();
    const materno = document.getElementById('ape_materno').value.trim();
    
    const hayCambiosPersonales = originalData && (
        originalData.nombres !== nombres ||
        originalData.ape_paterno !== paterno ||
        originalData.ape_materno !== materno
    );
    
    const currentPass = document.getElementById('current_password').value;
    const hayCambioPassword = currentPass && currentPass.length > 0;
    
    // Verificar si hay foto nueva
    const fileInput = document.getElementById('fileInput');
    const photoBase64 = document.getElementById('photoBase64').value;
    const hayFotoNueva = fileInput.files.length > 0 || photoBase64.length > 0;
    
    // Si no hay cambios, mostrar mensaje
    if (!hayCambiosPersonales && !hayCambioPassword && !hayFotoNueva) {
        showSwalInfo('No hay cambios para guardar');
        return;
    }
    
    const saveButton = document.getElementById('saveButton');
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    saveButton.disabled = true;
    
    try {
        const formData = new FormData();
        formData.append('nombres', nombres);
        formData.append('ape_paterno', paterno);
        formData.append('ape_materno', materno);
        
        // Agregar datos de contraseña si se están cambiando
        if (hayCambioPassword) {
            formData.append('current_password', currentPass);
            formData.append('new_password', document.getElementById('new_password').value);
        }
        
        // Agregar foto si se seleccionó desde galería
        if (fileInput.files.length > 0) {
            formData.append('foto', fileInput.files[0]);
        }
        // Agregar foto base64 si se tomó con cámara
        else if (photoBase64.length > 0) {
            // Convertir base64 a blob
            const blob = base64ToBlob(photoBase64);
            formData.append('foto', blob, 'foto_usuario.jpg');
        }
        
        const response = await fetch('/main/usuario/actualizar_perfil_completo', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSwalSuccessAndReload(data.message);
            
            // Actualizar datos locales
            if (data.usuario) {
                usuarioData = {
                    ...usuarioData,
                    ...data.usuario
                };
                originalData = JSON.parse(JSON.stringify(usuarioData));
            }
            
            // Limpiar campos de contraseña
            document.getElementById('current_password').value = '';
            document.getElementById('new_password').value = '';
            document.getElementById('confirm_password').value = '';
            
            // Limpiar foto temporal
            document.getElementById('photoBase64').value = '';
            fileInput.value = '';
            
        } else {
            showSwalError(data.error || 'Error al actualizar el perfil');
            saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Todos los Cambios';
            saveButton.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showSwalError('Error al conectar con el servidor');
        saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Todos los Cambios';
        saveButton.disabled = false;
    }
}

function base64ToBlob(base64) {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
}

function openPhotoOptions() {
    document.getElementById('photoOptionsModal').style.display = 'flex';
}

function closePhotoOptions() {
    document.getElementById('photoOptionsModal').style.display = 'none';
    isTakingPhoto = false;
}

function selectFromGallery() {
    closePhotoOptions();
    document.getElementById('fileInput').click();
}

function takePhoto() {
    closePhotoOptions();
    
    // Usar MediaDevices API para acceder directamente a la cámara
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment', // Usar cámara trasera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        })
        .then(function(stream) {
            // Crear modal para mostrar la cámara
            createCameraModal(stream);
        })
        .catch(function(error) {
            console.error('Error al acceder a la cámara:', error);
            
            // Si falla la API de cámara, usar input con capture
            fallbackCameraInput();
        });
    } else {
        // Si el navegador no soporta la API, usar método alternativo
        fallbackCameraInput();
    }
}

function createCameraModal(stream) {
    // Crear modal para cámara
    const cameraModal = document.createElement('div');
    cameraModal.id = 'cameraModal';
    cameraModal.className = 'camera-modal';
    cameraModal.innerHTML = `
        <div class="camera-modal-content">
            <div class="camera-header">
                <h5>Tomar Foto</h5>
                <button class="close-camera">&times;</button>
            </div>
            <div class="camera-body">
                <video id="cameraVideo" autoplay playsinline></video>
                <canvas id="cameraCanvas" style="display: none;"></canvas>
            </div>
            <div class="camera-footer">
                <button id="captureBtn" class="btn btn-primary">
                    <i class="fas fa-camera"></i> Capturar
                </button>
                <button id="cancelCameraBtn" class="btn btn-secondary">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(cameraModal);
    
    // Configurar video
    const video = document.getElementById('cameraVideo');
    video.srcObject = stream;
    
    // Eventos
    document.querySelector('.close-camera').onclick = function() {
        closeCameraModal(stream, cameraModal);
    };
    
    document.getElementById('cancelCameraBtn').onclick = function() {
        closeCameraModal(stream, cameraModal);
    };
    
    document.getElementById('captureBtn').onclick = function() {
        capturePhoto(stream, cameraModal);
    };
    
    // Cerrar con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCameraModal(stream, cameraModal);
        }
    });
    
    // Agregar estilos si no existen
    if (!document.getElementById('camera-styles')) {
        const style = document.createElement('style');
        style.id = 'camera-styles';
        style.textContent = `
            .camera-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .camera-modal-content {
                background: #152a3a;
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                overflow: hidden;
                border: 2px solid #40e0d0;
            }
            .camera-header {
                background: #1e3a5a;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #40e0d0;
            }
            .camera-header h5 {
                color: #40e0d0;
                margin: 0;
                font-size: 18px;
            }
            .close-camera {
                background: none;
                border: none;
                color: #fff;
                font-size: 24px;
                cursor: pointer;
                transition: color 0.3s;
            }
            .close-camera:hover {
                color: #f87171;
            }
            .camera-body {
                padding: 20px;
                text-align: center;
            }
            #cameraVideo {
                width: 100%;
                max-height: 400px;
                border-radius: 8px;
                background: #000;
            }
            .camera-footer {
                padding: 15px 20px;
                background: #1e3a5a;
                display: flex;
                gap: 10px;
                justify-content: center;
                border-top: 1px solid #40e0d0;
            }
            .camera-footer .btn {
                min-width: 120px;
            }
        `;
        document.head.appendChild(style);
    }
}

function closeCameraModal(stream, modal) {
    // Detener stream de cámara
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    // Remover modal
    if (modal) {
        document.body.removeChild(modal);
    }
}

function capturePhoto(stream, modal) {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    
    // Configurar canvas con las mismas dimensiones que el video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dibujar el frame actual del video en el canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir a base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    // Actualizar vista previa
    document.getElementById('profilePhoto').src = imageData;
    document.getElementById('photoBase64').value = imageData;
    
    // Limpiar fileInput para evitar conflictos
    document.getElementById('fileInput').value = '';
    
    // Cerrar modal y detener cámara
    closeCameraModal(stream, modal);
    
    showSwalSuccess('Foto capturada correctamente');
}

function fallbackCameraInput() {
    // Método alternativo para navegadores antiguos
    const cameraInput = document.createElement('input');
    cameraInput.type = 'file';
    cameraInput.accept = 'image/*';
    cameraInput.capture = 'environment';
    cameraInput.style.display = 'none';
    
    cameraInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            // Convertir a base64 para vista previa
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('profilePhoto').src = event.target.result;
                document.getElementById('photoBase64').value = event.target.result;
                // Limpiar fileInput para evitar conflictos
                document.getElementById('fileInput').value = '';
            };
            reader.readAsDataURL(file);
        }
    };
    
    document.body.appendChild(cameraInput);
    cameraInput.click();
    setTimeout(() => {
        document.body.removeChild(cameraInput);
    }, 100);
}

function subirFotoPerfil(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showSwalError('La imagen no debe superar los 2MB');
        e.target.value = '';
        return;
    }
    
    // Validar tipo de archivo - aceptar múltiples formatos
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
        'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml',
        'image/avif'
    ];
    
    if (!allowedTypes.includes(file.type)) {
        showSwalError('Formato de imagen no permitido. Use JPG, PNG, GIF, WEBP, BMP, TIFF, SVG o AVIF');
        e.target.value = '';
        return;
    }
    
    // Mostrar vista previa y limpiar foto de cámara si existe
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('profilePhoto').src = event.target.result;
        document.getElementById('photoBase64').value = '';
    };
    reader.readAsDataURL(file);
}

function removePhoto() {
    Swal.fire({
        title: '¿Eliminar foto de perfil?',
        text: "Se restaurará la foto por defecto",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#40e0d0',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Enviar solicitud para eliminar foto
            fetch('/main/usuario/eliminar_foto', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Actualizar foto localmente
                    document.getElementById('profilePhoto').src = '/static/images/usuario/userdefault.jpg';
                    document.getElementById('fileInput').value = '';
                    document.getElementById('photoBase64').value = '';
                    
                    if (usuarioData) {
                        usuarioData.foto_usuario = null;
                    }
                    
                    showSwalSuccessAndReload('Foto eliminada correctamente');
                } else {
                    showSwalError(data.error || 'Error al eliminar la foto');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showSwalError('Error al conectar con el servidor');
            });
        }
    });
}

function resetForm() {
    Swal.fire({
        title: '¿Descartar cambios?',
        text: "Se perderán todos los cambios no guardados",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#40e0d0',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            mostrarDatosUsuario();
            document.getElementById('fileInput').value = '';
            document.getElementById('photoBase64').value = '';
            document.getElementById('current_password').value = '';
            document.getElementById('new_password').value = '';
            document.getElementById('confirm_password').value = '';
            
            // Limpiar validaciones
            document.querySelectorAll('.is-invalid').forEach(el => {
                el.classList.remove('is-invalid');
            });
        }
    });
}

// Funciones para SweetAlert2 - NUEVA FUNCIÓN CON RECARGA
function showSwalSuccessAndReload(message) {
    Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: message,
        timer: 2000,
        showConfirmButton: false,
        didClose: () => {
            // Recargar la página después de cerrar el mensaje
            location.reload();
        }
    });
}

function showSwalSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: message,
        timer: 2000,
        showConfirmButton: false
    });
}

function showSwalError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        timer: 4000,
        confirmButtonText: 'Aceptar'
    });
}

function showSwalInfo(message) {
    Swal.fire({
        icon: 'info',
        title: 'Información',
        text: message,
        timer: 2000,
        showConfirmButton: false
    });
}