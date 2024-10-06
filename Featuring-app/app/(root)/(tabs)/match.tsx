import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import Swiper from 'react-native-deck-swiper';

const { width, height } = Dimensions.get('window');

// ... (DUMMY_USERS permanece igual)
const DUMMY_USERS = [
  {
    id: 1,
    nombre_completo: "Cris Fourkahde",
    foto_perfil: "https://example.com/cris.jpg",
    ubicacion: "Concepción",
    distancia: "3 kms away",
    busco: "baterista",
    habilidades: ["Bassist", "Film Music Composer", "Synth Explorer", "Guitar"]
  },
  {
    id: 2,
    nombre_completo: "Laura Strings",
    foto_perfil: "https://example.com/laura.jpg",
    ubicacion: "Santiago",
    distancia: "5 kms away",
    busco: "guitarrista",
    habilidades: ["Violinist", "Orchestra Conductor", "Piano"]
  },
  {
    id: 3,
    nombre_completo: "Mike Beats",
    foto_perfil: "https://example.com/mike.jpg",
    ubicacion: "Valparaíso",
    distancia: "10 kms away",
    busco: "vocalista",
    habilidades: ["Drummer", "Percussionist", "Music Producer"]
  }
];
const MatchCard = ({ user }) => (
  <View className="bg-white rounded-3xl p-5 border-2 border-green-500 w-[90%] h-[70%] justify-center items-center">
    <View className="bg-purple-600 p-3 rounded-full mb-4">
      <Text className="text-white text-center text-base">
        Hola, me gustaría encontrar {user.busco}
      </Text>
    </View>
    
    <Image
      source={{ uri: user.foto_perfil }}
      className="w-48 h-48 rounded-lg self-center mb-4"
    />
    
    <Text className="text-2xl font-bold text-center mb-1">{user.nombre_completo}</Text>
    <Text className="text-gray-600 text-center mb-2">{user.ubicacion} • {user.distancia}</Text>
    
    <Text className="text-purple-600 font-semibold text-center">
      {user.habilidades.slice(0, 3).join(', ')}
    </Text>
    {user.habilidades.length > 3 && (
      <Text className="text-purple-600 text-center">&amp; {user.habilidades.length - 3} more</Text>
    )}
  </View>
);

const Match = () => {
  const handleSwipedRight = (index) => {
    console.log(`Liked ${DUMMY_USERS[index].nombre_completo}`);
  };

  const handleSwipedLeft = (index) => {
    console.log(`Passed ${DUMMY_USERS[index].nombre_completo}`);
  };

  return (
    <View className="flex-1 bg-gray-100 justify-center items-center">
         <View className="w-full h-full pb-20">
        <Swiper
          cards={DUMMY_USERS}
          renderCard={(card) => <MatchCard user={card} />}
          onSwipedRight={handleSwipedRight}
          onSwipedLeft={handleSwipedLeft}
          cardIndex={0}
          backgroundColor={'transparent'}
          stackSize={3}
          stackSeparation={15}
          outputRotationRange={["-5deg", "0deg", "5deg"]}
          cardHorizontalMargin={0}
          cardVerticalMargin={0}
          containerStyle={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </View>
    </View>
  );
};

export default Match;