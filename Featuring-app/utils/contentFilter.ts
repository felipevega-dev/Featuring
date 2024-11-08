// Lista de palabras ofensivas en español e inglés
const palabrasOfensivas = [
  // Español - Insultos y groserías comunes
  'puta', 'puto', 'mierda', 'pendejo', 'idiota', 'estupido', 'maricon', 'perra',
  'verga', 'pinga', 'coño', 'culo', 'joder', 'cabron', 'zorra', 'marica',
  'pendeja', 'chinga', 'carajo', 'malparido', 'gonorrea', 'hijueputa', 'maldito',
  'bastardo', 'imbecil', 'tarado', 'huevon', 'baboso', 'estupida','aweonao','conchetumare','ctm','agilao','embarao','ql','wn','kl'
  

  // Inglés - Insultos y groserías comunes
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'whore', 'slut',
  'cunt', 'cock', 'bastard', 'motherfucker', 'retard', 'faggot', 'nigga',
  'nigger', 'crap', 'damn', 'ass', 'idiot', 'stupid', 'dumb', 'moron',
  
  // Variaciones comunes
  'put@', 'put0', 'mrd', 'hp', 'hpta', 'hdp', 'ptm', 'ctm', 'stfu',
  'fck', 'fuk', 'fvck', 'b1tch', 'b!tch', 'sh1t', 'sh!t', 'a$$'
];

// Función para detectar contenido ofensivo
export const containsOffensiveContent = (text: string): boolean => {
  if (!text) return false;
  
  // Normalizar el texto (quitar acentos, convertir a minúsculas y eliminar caracteres especiales)
  const normalizedText = text.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, ""); // Solo deja letras, números y espacios
  
  // Dividir el texto en palabras
  const words = normalizedText.split(/\s+/);
  
  // Verificar cada palabra
  return words.some(word => {
    // Normalizar la palabra individual
    const normalizedWord = word.toLowerCase().trim();
    
    // Verificar si la palabra está en la lista de palabras ofensivas
    return palabrasOfensivas.some(badWord => {
      const normalizedBadWord = badWord.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      // Comprobar coincidencia exacta o como parte de la palabra
      return normalizedWord === normalizedBadWord || 
             normalizedWord.includes(normalizedBadWord);
    });
  });
};

// Función para validar contenido
export const validateContent = (text: string, type: 'titulo' | 'descripcion' | 'comentario'): { 
  isValid: boolean; 
  message: string 
} => {
  if (!text?.trim()) {
    return {
      isValid: false,
      message: `El ${type} no puede estar vacío`
    };
  }

  if (containsOffensiveContent(text)) {
    const messages = {
      titulo: "El título contiene lenguaje inapropiado. Por favor, modifícalo.",
      descripcion: "La descripción contiene lenguaje inapropiado. Por favor, modifícala.",
      comentario: "Tu comentario contiene lenguaje inapropiado. Por favor, modifícalo."
    };

    return {
      isValid: false,
      message: messages[type]
    };
  }

  // Validar longitud según el tipo de contenido
  const maxLengths = {
    titulo: 100,
    descripcion: 500,
    comentario: 300
  };

  if (text.length > maxLengths[type]) {
    return {
      isValid: false,
      message: `El ${type} no puede exceder los ${maxLengths[type]} caracteres`
    };
  }

  return {
    isValid: true,
    message: ""
  };
}; 