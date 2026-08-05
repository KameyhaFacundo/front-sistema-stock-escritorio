import LegalLayout from './LegalLayout';
import { APP_NAME } from '../../config/brand';

const SUPPORT_EMAIL = 'kamexsolutions@gmail.com';

export default function Terminos() {
  return (
    <LegalLayout titulo="Términos y Condiciones" actualizado="11 de julio de 2026">
      <p>
        Estos Términos y Condiciones regulan el acceso y uso de {APP_NAME}, un sistema de
        gestión de stock, ventas, caja y facturación para comercios. Al crear una cuenta o usar
        la plataforma, aceptás estos términos. Si no estás de acuerdo, no debés usar {APP_NAME}.
      </p>

      <h2>1. Qué es {APP_NAME}</h2>
      <p>
        {APP_NAME} es un software como servicio (SaaS) que permite administrar punto de venta,
        stock, compras, clientes, proveedores, caja, reportes y, según el plan contratado,
        catálogo online, cobro con Mercado Pago, facturación electrónica y funciones de
        inteligencia artificial. Las funciones disponibles dependen del plan activo de tu
        empresa.
      </p>

      <h2>2. Tu cuenta</h2>
      <p>
        Para usar {APP_NAME} necesitás crear una cuenta con datos reales y actualizados. Sos
        responsable de mantener tu contraseña segura y de toda la actividad que ocurra desde tu
        cuenta o las de los usuarios que invites a tu empresa. Avisanos de inmediato si
        sospechás un acceso no autorizado.
      </p>

      <h2>3. Prueba gratuita, planes y pagos</h2>
      <p>
        Ofrecemos 7 días de prueba gratuita sin necesidad de tarjeta. Pasado ese período,
        continuar usando {APP_NAME} requiere contratar uno de los planes pagos disponibles
        (Esencial, Pro o IA), cada uno con sus propios límites de productos, usuarios,
        sucursales y funciones.
      </p>
      <p>
        El pago de la suscripción se procesa a través de Mercado Pago, con periodicidad mensual
        o anual según elijas. Si el pago no se acredita, podemos suspender el acceso a las
        funciones pagas hasta que se regularice la situación. Los importes ya abonados no son
        reembolsables, salvo que la normativa aplicable disponga lo contrario; si cancelás,
        conservás el acceso hasta el final del período ya pago.
      </p>
      <p>
        Podemos actualizar los precios o las condiciones de los planes para períodos futuros.
        Cualquier cambio se te va a informar antes de que se aplique a tu próxima renovación.
      </p>

      <h2>4. Uso permitido</h2>
      <p>Te comprometés a usar {APP_NAME} de buena fe y a no:</p>
      <ul>
        <li>Cargar información falsa o que infrinja derechos de terceros.</li>
        <li>Intentar vulnerar la seguridad, el código o la infraestructura de la plataforma.</li>
        <li>Usar el sistema para fines ilícitos o para perjudicar a otros usuarios.</li>
        <li>Revender, sublicenciar o explotar {APP_NAME} sin autorización.</li>
      </ul>

      <h2>5. Datos que cargás en el sistema</h2>
      <p>
        Toda la información de tu negocio (productos, ventas, clientes, proveedores, caja,
        etc.) es de tu propiedad. Vos sos responsable de que sea correcta y de contar con la
        autorización necesaria cuando cargues datos de terceros (por ejemplo, clientes o
        empleados). {APP_NAME} no se hace dueño de esos datos por el solo hecho de alojarlos
        para prestarte el servicio.
      </p>

      <h2>6. Funciones de inteligencia artificial</h2>
      <p>
        Las funciones de IA (sugerencia de precios y categorías, generación o composición de
        fotos de producto, escaneo de facturas y el asistente interno) están disponibles según
        tu plan y funcionan enviando la información puntual de cada consulta a un proveedor
        externo de IA para generar la respuesta. Estas funciones son una ayuda: revisá siempre
        los resultados (precios sugeridos, datos extraídos de una factura, etc.) antes de
        confirmarlos, ya que pueden contener errores.
      </p>

      <h2>7. Integraciones con terceros</h2>
      <p>
        Algunas funciones dependen de servicios de terceros (Mercado Pago para cobros,
        proveedores de facturación electrónica, WhatsApp, Google para IA). No controlamos la
        disponibilidad ni el funcionamiento de esos servicios externos y no somos responsables
        por fallas, demoras o decisiones que tomen esos terceros, sin perjuicio de las
        obligaciones legales que nos correspondan.
      </p>

      <h2>8. Disponibilidad del servicio</h2>
      <p>
        Hacemos esfuerzos razonables para mantener {APP_NAME} disponible, pero puede haber
        interrupciones por mantenimiento, actualizaciones o causas fuera de nuestro control. No
        garantizamos disponibilidad ininterrumpida.
      </p>

      <h2>9. Cancelación</h2>
      <p>
        Podés dejar de usar {APP_NAME} y no renovar tu plan cuando quieras. La cancelación no
        genera reintegro del período ya abonado. Podemos suspender o cancelar una cuenta que
        incumpla estos términos, use la plataforma de forma fraudulenta o ponga en riesgo la
        seguridad del sistema o de otros usuarios, avisando por email siempre que sea posible.
      </p>

      <h2>10. Propiedad intelectual</h2>
      <p>
        El software, diseño, marca y contenido de {APP_NAME} nos pertenecen. Usar la
        plataforma no te transfiere ningún derecho sobre ellos. No está permitido copiar,
        modificar o hacer ingeniería inversa del sistema.
      </p>

      <h2>11. Límite de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, no somos responsables por daños indirectos, pérdida
        de ganancias o de información que no sean consecuencia directa de un incumplimiento
        nuestro, ni por fallas originadas en servicios de terceros integrados a la plataforma.
      </p>

      <h2>12. Cambios a estos términos</h2>
      <p>
        Podemos actualizar estos Términos y Condiciones para reflejar cambios legales,
        técnicos o del servicio. Si seguís usando {APP_NAME} después de un cambio relevante,
        se considera que lo aceptás.
      </p>

      <h2>13. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa se
        resolverá ante los tribunales competentes, sin perjuicio de los derechos irrenunciables
        que puedan corresponderte como usuario o consumidor.
      </p>

      <h2>14. Contacto</h2>
      <p>
        Ante cualquier consulta sobre estos términos, escribinos a{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalLayout>
  );
}
