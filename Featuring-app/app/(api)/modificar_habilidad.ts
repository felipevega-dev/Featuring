import { supabase } from "@/lib/supabase";

export async function PUT(request: Request) {
  try {
    const { id_habilidad, nombre_habilidad } = await request.json();

    if (!id_habilidad || !nombre_habilidad) {
      return Response.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // Actualiza los datos en Supabase
    const { data: perfilData, error: perfilError } = await supabase
      .from("perfil_habilidad")
      .update({
        habilidad: nombre_habilidad
      })
      .eq('id', id_habilidad)
      .select();

    if (perfilError) {
      throw perfilError;
    }

    if (!perfilData || perfilData.length === 0) {
      return Response.json(
        { error: "No se encontró la habilidad para actualizar" },
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