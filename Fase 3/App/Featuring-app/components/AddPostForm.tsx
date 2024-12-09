import React, { useState } from "react";
import { View, Button } from "react-native";
import UploadSongModal from "./UploadSongModal";

interface AddPostFormProps {
  onUploadSuccess: () => void;
}

const AddPostForm: React.FC<AddPostFormProps> = ({ onUploadSuccess }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleUploadSuccess = () => {
    onUploadSuccess();
    setIsModalVisible(false);
  };

  return (
    <View>
      <Button
        title="Subir nueva canción"
        onPress={() => setIsModalVisible(true)}
      />
      <UploadSongModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </View>
  );
};

export default AddPostForm;
