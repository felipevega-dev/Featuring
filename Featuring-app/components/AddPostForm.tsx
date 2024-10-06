import React, { useState } from 'react';
import { View, Button } from 'react-native';

const AddPostForm: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleUploadSuccess = () => {
    // Actualizar la lista de publicaciones o realizar otras acciones necesarias
  };

  return (
    <View>
      <Button title="Subir nueva canción" onPress={() => setIsModalVisible(true)} />
    </View>
  );
};

export default AddPostForm;