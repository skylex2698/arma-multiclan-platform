## Lista de tareas pendientes

### Usuarios y registro

* Permitir la eliminación de usuarios.
* Durante el registro, debe aparecer la opción **“Nuevo clan”** para aquellos usuarios que aún no pertenezcan a ninguno.
* Cuando un usuario solicite crear un nuevo clan durante el registro, el administrador de la plataforma deberá aprobar esa solicitud.
* Una vez aprobada la solicitud:

  * el usuario podrá iniciar sesión;
  * la primera pantalla que verá será la de **creación del clan**;
  * ese usuario pasará a ser automáticamente el **administrador de ese clan**.

### Gestión de clanes

* El líder del clan debe tener permiso para transferir el liderazgo a otro miembro desde la ventana de **Personal**.
* En la sección **Clanes**, cuando se visualiza la lista de miembros de un clan, no debe mostrarse públicamente el correo electrónico de cada usuario, ya que es un dato personal.
* En la ventana de **Clanes**, los cards de los clanes deben tener todos la misma altura. Como la descripción solo muestra dos líneas y el resto del texto queda oculto, todos los cards deberían mantener una altura uniforme, tengan o no descripción.

### Escuadras

* Crear plantillas de escuadras por tipo, por ejemplo:

  * Asalto
  * Apoyo
  * Equipo AT
  * etc.

  Estas plantillas deben permitir diferentes combinaciones y distintos números de jugadores por equipo.
* Al crear un evento, debe ser posible definir una escuadra y reservarla directamente a un clan.
* Durante la definición de escuadras al crear un evento, debe existir la opción de **duplicar una escuadra existente** para crear una nueva a partir de ella.
* El líder del clan debe poder **reservar una escuadra** en un evento.
* En crear o editar evento:

  * donde actualmente dice **“Escuadra padre”**, debe cambiarse por **“Frecuencia externa con”**;
  * donde dice **“sin padre”**, debe cambiarse por **“sin enlace”**.
* Una vez que una escuadra se marque como **mando de misión**, no debe permitirse que otra escuadra pueda marcarse también con esa misma función.
* Cuando se seleccione una escuadra como **mando de misión**, esa opción debe desaparecer o quedar bloqueada para el resto de escuadras.

### Eventos

* En operaciones, también debería poder abrirse un evento aunque esté eliminado, igual que actualmente puede visualizarse un evento finalizado.
* Al crear un evento, debe existir la opción de definirlo como **público** o **privado**.
* Si el evento es privado, debe permitirse invitar a clanes a participar en él.
* Al crear un evento aparece el texto:

  **“El evento se guardará con esta zona y luego se mostrará también en la hora local del usuario.”**

  Ese texto debe eliminarse.
* Cambiar el texto de ejemplo **“[BEAR] Servidor público”** por otro ejemplo más genérico.
* Al compartir un evento y acceder a la web compartida, el bloque de archivos debe tener el mismo diseño que el bloque **“Archivos del evento”** que aparece en la pestaña **Briefing** del evento.
* En ese mismo bloque, debe eliminarse el texto descriptivo que aparece debajo del título.
* En el evento compartido, debe eliminarse el botón del encabezado que aparece duplicado.

### Archivos

* Al subir un archivo, el sistema debe indicar de forma clara el motivo del error.
* Por ejemplo, si el archivo supera el tamaño máximo permitido, debe mostrarse explícitamente ese mensaje.

### Edición de eventos y bugs

* **Bug al editar escuadras en un evento:**

  * Si se crea un evento con escuadras;
  * luego se edita el evento;
  * se eliminan las escuadras existentes;
  * sin guardar los cambios, se añaden nuevas escuadras;
  * y finalmente se guarda;

  las escuadras eliminadas no desaparecen y se solapan con las nuevas.
* **Bug al borrar escuadras en un evento ya creado:**

  * Al editar un evento, borrar las escuadras y guardar;
  * al volver a visualizar el evento, las escuadras siguen apareciendo;
  * además, por el bug anterior, cada vez se acumulan más escuadras.

### Perfil de usuario

* En el perfil del usuario debe poder configurarse su **zona horaria por defecto**.
* Las fechas de los eventos deben mostrarse según la zona horaria elegida por el usuario.
* La zona horaria por defecto debe ser **Madrid**.

### Duda funcional

* Aclarar cuántos usuarios pueden registrarse utilizando un mismo correo electrónico.