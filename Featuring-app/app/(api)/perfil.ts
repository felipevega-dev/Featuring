import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { nombre_art, clerkId, sexo_art, fecha_nac, descripcion, redes_social, fotoperfil, ubi, edad_art, usuario_id } = await request.json();

    if (!nombre_art || !sexo_art || !fecha_nac || !descripcion || !redes_social || !fotoperfil || !ubi || !edad_art || !usuario_id) {
      return Response.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // Almacena los datos del usuario en Supabase
    const { data, error } = await supabase
      .from("perfil") 
      .insert({
        usuario_id: usuario_id,
        clerk_id: clerkId,
        nombre_completo: nombre_art,
        sexo: sexo_art,
        fecha_nacimiento: fecha_nac,
        biografia: descripcion,
        redes_sociales: redes_social,
        foto_perfil: fotoperfil,
        ubicacion: ubi,
        edad: edad_art
      });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ data }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return Response.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}