import { supabase } from "@/lib/supabase";

export async function PUT(request: Request) {
  try {
    const { usuario_id, nombre_art, sexo_art, fecha_nac, descripcion, redes_social, fotoperfil, ubi, edad_art, generos, habilidades } = await request.json();

    if (!usuario_id || !nombre_art || !sexo_art || !fecha_nac || !descripcion || !redes_social || !fotoperfil || !ubi || !edad_art || !generos || !habilidades) {
      return Response.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // Actualiza los datos del usuario en Supabase
    const { data: perfilData, error: perfilError } = await supabase
      .from("perfil")
      .update({
        nombre_completo: nombre_art,
        sexo: sexo_art,
        fecha_nacimiento: fecha_nac,
        biografia: descripcion,
        redes_sociales: redes_social,
        foto_perfil: fotoperfil,
        ubicacion: ubi,
        edad: edad_art
      })
      .eq('usuario_id', usuario_id)
      .select();

    if (perfilError) {
      throw perfilError;
    }

    if (!perfilData || perfilData.length === 0) {
      return Response.json(
        { error: "No se encontró el perfil para actualizar" },
        { status: 404 },
      );
    }

    // Aquí podrías agregar lógica adicional para actualizar géneros y habilidades si es necesario

    return new Response(JSON.stringify({ data: perfilData[0] }), {
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return Response.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}