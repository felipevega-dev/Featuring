import { supabase } from '@/lib/supabase';
import { PreguntasState } from '@/types/preguntas';
import { Alert } from 'react-native';

export async function saveProfile(state: PreguntasState) {
  try {
    const { username, telefono, genero, fechaNacimiento, descripcion, profileImage, location, nacionalidad } = state;
    
    if (!username || !telefono || !fechaNacimiento.dia || !fechaNacimiento.mes || !fechaNacimiento.anio || !genero || !nacionalidad) {
      throw new Error("Faltan campos obligatorios");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("No se encontró el ID de usuario autenticado");
    }

    const fechaNacimientoDate = new Date(fechaNacimiento.anio, fechaNacimiento.mes - 1, fechaNacimiento.dia);
    const edad = calcularEdad(fechaNacimiento.dia, fechaNacimiento.mes, fechaNacimiento.anio);

    const perfilData = {
      usuario_id: user.id,
      username,
      fecha_nacimiento: fechaNacimientoDate.toISOString(),
      biografia: descripcion || null,
      foto_perfil: profileImage || null,
      edad,
      sexo: genero,
      ubicacion: location?.ubicacion || null,
      latitud: location?.coords.latitude || null,
      longitud: location?.coords.longitude || null,
      numtelefono: telefono || null,
      nacionalidad,
    };

    const { data, error } = await supabase
      .from("perfil")
      .upsert(perfilData)
      .select();

    if (error) {
      throw error;
    }

    // Insertar habilidades y géneros musicales
    await insertarHabilidadesYGeneros(user.id, state.habilidadesMusicales, state.generosMusicales);

    Alert.alert("Perfil guardado exitosamente");
  } catch (error) {
    console.error("Error detallado al guardar el perfil:", error);
    Alert.alert(
      "Error al guardar el perfil",
      error instanceof Error
        ? error.message
        : "Hubo un problema al guardar la información"
    );
  }
}

function calcularEdad(dia: number, mes: number, anio: number): number {
  const fechaNacimiento = new Date(anio, mes - 1, dia);
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const m = hoy.getMonth() - fechaNacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }
  return edad;
}

async function insertarHabilidadesYGeneros(perfilId: string, habilidades: string[], generos: string[]) {
  for (const habilidad of habilidades) {
    await supabase
      .from("perfil_habilidad")
      .upsert({ perfil_id: perfilId, habilidad });
  }

  for (const genero of generos) {
    await supabase
      .from("perfil_genero")
      .upsert({ perfil_id: perfilId, genero });
  }
}

export async function checkPhoneNumberExists(phoneNumber: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('perfil')
      .select('numtelefono')
      .eq('numtelefono', phoneNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Este error significa que no se encontraron filas, lo cual es lo que queremos
        return false;
      }
      console.error('Error checking phone number:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking phone number:', error);
    throw error;
  }
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('perfil')
      .select('username')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Este error significa que no se encontraron filas, lo cual es lo que queremos
        return false;
      }
      console.error('Error checking username:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking username:', error);
    throw error;
  }
}
