import { supabase } from "@/lib/supabase"; // Asegúrate de que la ruta sea correcta

export async function POST(request: Request) {
  try {
    const { username, email, clerkId } = await request.json();

    if (!username || !email || !clerkId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Almacena los datos del usuario en Supabase
    const { data, error } = await supabase
      .from("usuario") // Cambia esto si el nombre de tu tabla es diferente
      .insert([
        {
          username: username,
          correo_electronico: email,
        },
      ]);

    if (error) {
      throw error; // Lanzar error si ocurre
    }

    return new Response(JSON.stringify({ data }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
