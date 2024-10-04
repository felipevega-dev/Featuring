import { supabase } from "@/lib/supabase";

export async function PUT(request: Request) {
  try {
    const { id_genero, nombre_genero } = await request.json();

    if (!id_genero || !nombre_genero) {
      return Response.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // Actualiza los datos en Supabase
    const { data: perfilData, error: perfilError } = await supabase
      .from("perfil_habilidad")
      .update({
        genero: nombre_genero
      })
      .eq('id', id_genero)
      .select();

    if (perfilError) {
      throw perfilError;
    }

    if (!perfilData || perfilData.length === 0) {
      return Response.json(
        { error: "No se encontró el registro para actualizar" },
        { status: 404 },
      );
    }

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