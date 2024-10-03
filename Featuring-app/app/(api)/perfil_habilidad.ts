import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const {  id_habilidad, nombre_habilidad } = await request.json();

    if (!id_habilidad || !nombre_habilidad ) {
      return Response.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // Almacena los datos del usuario en Supabase
    const { data: perfilData, error: perfilError } = await supabase
      .from("perfil_habilidad") 
      .insert({
        id : id_habilidad,
        habilidad : nombre_habilidad
      })
      .select();

    if (perfilError) {
      throw perfilError;
    }

  

    return new Response(JSON.stringify({ data: perfilData[0] }), {
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