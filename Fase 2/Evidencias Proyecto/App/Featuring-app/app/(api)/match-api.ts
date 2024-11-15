import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const {
      nombre_art,
      sexo_art,
      fecha_nac,
      descripcion,
      redes_social,
      fotoperfil,
      ubi,
      edad_art,
      usuario_id,
      generos,
      habilidades,
    } = await request.json();

    if (
      !nombre_art ||
      !sexo_art ||
      !fecha_nac ||
      !descripcion ||
      !redes_social ||
      !fotoperfil ||
      !ubi ||
      !edad_art ||
      !usuario_id ||
      !generos ||
      !habilidades
    ) {
      return Response.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Almacena los datos del usuario en Supabase
    const { data: perfilData, error: perfilError } = await supabase
      .from("perfil")
      .insert({
        usuario_id: usuario_id,
        nombre_completo: nombre_art,
        sexo: sexo_art,
        fecha_nacimiento: fecha_nac,
        biografia: descripcion,
        redes_sociales: redes_social,
        foto_perfil: fotoperfil,
        ubicacion: ubi,
        edad: edad_art,
      })
      .select();

    if (perfilError) {
      throw perfilError;
    }

    return new Response(JSON.stringify({ data: perfilData[0] }), {
      status: 201,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
