import LegalLayout from './LegalLayout';
import { APP_NAME } from '../../config/brand';

const SUPPORT_EMAIL = 'kamexsolutions@gmail.com';

export default function Privacidad() {
  return (
    <LegalLayout titulo="Política de Privacidad" actualizado="11 de julio de 2026">
      <p>
        Esta Política de Privacidad explica qué información recopila {APP_NAME} cuando usás
        nuestro sistema de gestión de stock, ventas, caja y facturación, para qué la usamos,
        con quién la compartimos y qué derechos tenés sobre ella. Aplica al sitio web, la
        plataforma, el catálogo online, el asistente de IA interno y cualquier otra función
        que ofrezcamos dentro de {APP_NAME}.
      </p>
      <p>
        Al crear una cuenta o usar {APP_NAME} aceptás el tratamiento de tus datos conforme a
        lo descripto acá, en el marco de la Ley N.º 25.326 de Protección de Datos Personales
        de la República Argentina.
      </p>

      <h2>1. Qué información recopilamos</h2>
      <p>Según cómo uses el sistema, podemos tratar:</p>
      <ul>
        <li>Datos de la cuenta: nombre, email, teléfono y contraseña (encriptada) del usuario que se registra.</li>
        <li>Datos del negocio: razón social, CUIT, dirección, WhatsApp y logo que cargás en la configuración de tu empresa.</li>
        <li>Datos operativos que vos mismo cargás: productos, precios, stock, ventas, compras, clientes, proveedores, movimientos de caja y comprobantes.</li>
        <li>Datos de clientes o proveedores de tu negocio que decidas registrar en el sistema (nombre, CUIT/DNI, teléfono, dirección).</li>
        <li>Datos técnicos: dirección IP, tipo de dispositivo, navegador y registros de uso, para mantener la seguridad y el funcionamiento del sistema.</li>
        <li>Datos de pago: los necesarios para procesar tu suscripción, gestionados directamente por Mercado Pago (nunca vemos ni guardamos los datos de tu tarjeta).</li>
      </ul>

      <h2>2. Para qué usamos tus datos</h2>
      <ul>
        <li>Para darte acceso al sistema, mantener tu cuenta activa y brindarte soporte.</li>
        <li>Para procesar tus ventas, compras, stock y reportes dentro de tu empresa.</li>
        <li>Para cobrar tu suscripción a través de Mercado Pago y avisarte sobre el estado de tu plan.</li>
        <li>Para las funciones de inteligencia artificial que activás vos: sugerencia de precios y categorías, generación o composición de fotos de producto, escaneo de facturas y el asistente interno. Ver la sección 4.</li>
        <li>Para prevenir fraude, proteger la seguridad de la plataforma y cumplir obligaciones legales o fiscales.</li>
        <li>Para mejorar el sistema, corregir errores y desarrollar nuevas funciones.</li>
      </ul>

      <h2>3. Aislamiento entre empresas</h2>
      <p>
        {APP_NAME} es una plataforma multiempresa: cada negocio que se registra tiene su
        información completamente separada de la de otros negocios. Ningún usuario de una
        empresa puede ver productos, ventas, clientes o datos de otra empresa distinta a la
        suya, salvo el equipo de soporte de {APP_NAME}, exclusivamente cuando sea necesario
        para resolver un problema técnico que reportes.
      </p>

      <h2>4. Uso de inteligencia artificial</h2>
      <p>
        Las funciones de IA de {APP_NAME} (sugerencia de precio y categoría, generación o
        composición de fotos de producto, escaneo de facturas y el asistente interno) usan la
        API de Google Gemini para procesar la información puntual que enviás en cada consulta
        (por ejemplo, el nombre de un producto, una foto o una pregunta sobre tus ventas). Esa
        información se envía a Google únicamente para generar la respuesta y no la usamos para
        entrenar modelos de terceros. El asistente interno tiene instrucciones estrictas de no
        revelar datos personales (CUIT, teléfono, dirección) de tus clientes o proveedores, y
        solo responde con información de tu propia empresa.
      </p>

      <h2>5. Con quién compartimos información</h2>
      <p>No vendemos tus datos. Los compartimos únicamente con:</p>
      <ul>
        <li>Proveedores de infraestructura y hosting que alojan la plataforma.</li>
        <li>Mercado Pago, para procesar el cobro de tu suscripción o los cobros que generes a tus clientes.</li>
        <li>Google (API de Gemini), para las funciones de inteligencia artificial que actives.</li>
        <li>WhatsApp, cuando usás el botón de contacto del catálogo público o del soporte.</li>
        <li>Autoridades administrativas o judiciales, únicamente si estamos legalmente obligados a hacerlo.</li>
      </ul>
      <p>
        Algunos de estos proveedores pueden alojar o procesar datos fuera de la Argentina.
        Cuando eso ocurre, exigimos condiciones razonables de seguridad y confidencialidad.
      </p>

      <h2>6. Cuánto tiempo conservamos tus datos</h2>
      <p>
        Mientras tu cuenta esté activa, conservamos tu información para que el sistema
        funcione. Si das de baja tu cuenta, conservamos los datos por un plazo razonable
        (hasta 45 días) por si querés recuperar el acceso o exportar tu información, salvo que
        una obligación legal o fiscal exija un plazo mayor. Pasado ese plazo, los datos se
        eliminan o se anonimizan.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Usamos conexiones cifradas (HTTPS), contraseñas encriptadas y controles de acceso para
        proteger tu información. Ningún sistema es 100% infalible, pero trabajamos activamente
        para mantener la plataforma segura y corregir vulnerabilidades apenas se detectan.
      </p>

      <h2>8. Tus derechos</h2>
      <p>
        Podés acceder, rectificar, actualizar o solicitar la eliminación de tus datos
        personales en cualquier momento. La mayoría de estas acciones las podés hacer vos
        mismo desde la configuración de tu cuenta; para lo demás, escribinos a{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>9. Datos de terceros que vos cargás</h2>
      <p>
        Si cargás en {APP_NAME} datos de tus clientes, empleados o proveedores, sos vos quien
        debe contar con la autorización correspondiente para hacerlo y sos responsable de que
        esos datos sean correctos y estén actualizados.
      </p>

      <h2>10. Cookies</h2>
      <p>
        Usamos almacenamiento local del navegador para mantener tu sesión iniciada y recordar
        tu preferencia de tema (claro/oscuro). No usamos cookies de publicidad ni de rastreo de
        terceros.
      </p>

      <h2>11. Cambios a esta política</h2>
      <p>
        Podemos actualizar esta Política de Privacidad para reflejar cambios en el sistema o en
        la normativa aplicable. La fecha de &ldquo;última actualización&rdquo; al inicio de esta página
        indica cuándo fue la última revisión. Si el cambio es relevante, te avisaremos por
        email o dentro de la plataforma.
      </p>

      <h2>12. Autoridad de control</h2>
      <p>
        La Agencia de Acceso a la Información Pública (AAIP), como órgano de control de la Ley
        N.º 25.326, es la autoridad ante la cual podés presentar reclamos relacionados con la
        protección de tus datos personales.
      </p>

      <h2>13. Contacto</h2>
      <p>
        Ante cualquier consulta sobre esta política o sobre tus datos, escribinos a{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalLayout>
  );
}
