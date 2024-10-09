import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';

interface UploadSongModalProps {
  isVisible: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function UploadSongModal({ isVisible, onClose, onUploadSuccess }: UploadSongModalProps) {
  const [title, setTitle] = useState('');
  const [contenido, setContenido] = useState('');
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageName, setCoverImageName] = useState<string | null>(null);

  const sanitizeFileName = (fileName: string): string => {
    return fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  };

  const getFileNameWithoutExtension = (fileName: string): string => {
    return fileName.replace(/\.[^/.]+$/, "");
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name;
        if (fileUri && fileName) {
          setAudioFile(fileUri);
          setAudioFileName(sanitizeFileName(fileName));
          // Set the title to the original file name without extension
          setTitle(getFileNameWithoutExtension(fileName));
        }
      }
    } catch (error) {
      console.error('Error picking audio:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo de audio');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileName = fileUri.split('/').pop() || 'cover.jpg';
        if (fileUri) {
          setCoverImage(fileUri);
          setCoverImageName(sanitizeFileName(fileName));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen de portada');
    }
  };

  const uploadSong = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No se encontró el usuario');

      if (!title || !audioFile || !coverImage || !audioFileName || !coverImageName || !contenido) {
        Alert.alert('Error', 'Por favor, completa todos los campos');
        return;
      }

      const sanitizedAudioFileName = sanitizeFileName(audioFileName);
      const sanitizedCoverImageName = sanitizeFileName(coverImageName);

      // Subir archivo de audio
      const { data: audioData, error: audioUploadError } = await supabase.storage
        .from('canciones')
        .upload(`${user.id}/${sanitizedAudioFileName}`, {
          uri: audioFile,
          name: sanitizedAudioFileName,
          type: 'audio/*'
        });
      if (audioUploadError) throw audioUploadError;

      // Obtener URL pública del archivo de audio
      const { data: { publicUrl: audioPublicUrl } } = supabase.storage
        .from('canciones')
        .getPublicUrl(`${user.id}/${sanitizedAudioFileName}`);

      // Subir imagen de portada
      const { data: imageData, error: imageUploadError } = await supabase.storage
        .from('caratulas')
        .upload(`${user.id}/${sanitizedCoverImageName}`, {
          uri: coverImage,
          name: sanitizedCoverImageName,
          type: 'image/*'
        });
      if (imageUploadError) throw imageUploadError;

      // Obtener URL pública de la imagen de portada
      const { data: { publicUrl: imagePublicUrl } } = supabase.storage
        .from('caratulas')
        .getPublicUrl(`${user.id}/${sanitizedCoverImageName}`);

      // Crear entrada en la tabla cancion
      const { data: songData, error: songError } = await supabase
        .from('cancion')
        .insert({
          usuario_id: user.id,
          titulo: title,
          archivo_audio: audioPublicUrl,
          caratula: imagePublicUrl,
          contenido: contenido,
        })
        .select()
        .single();
      if (songError) throw songError;

      Alert.alert('Éxito', 'Tu canción ha sido subida');
      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error('Error uploading song:', error);
      Alert.alert('Error', 'No se pudo subir la canción');
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white p-5 rounded-lg w-5/6 max-h-5/6">
          <Text className="text-xl font-bold mb-4">Subir Canción</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md p-2 mb-2"
            placeholder="Título de la canción"
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            className="border border-gray-300 rounded-md p-2 mb-2"
            placeholder="Descripción de la canción"
            value={contenido}
            onChangeText={setContenido}
            multiline
          />
          
          <TouchableOpacity onPress={pickAudio} className="bg-blue-500 p-2 rounded-md mb-2">
            <Text className="text-white text-center">Seleccionar Audio</Text>
          </TouchableOpacity>
          {audioFileName && <Text className="mb-2">Audio seleccionado: {audioFileName}</Text>}
          
          <TouchableOpacity onPress={pickImage} className="bg-green-500 p-2 rounded-md mb-2">
            <Text className="text-white text-center">Seleccionar Portada</Text>
          </TouchableOpacity>
          {coverImage && (
            <View>
              <Image source={{ uri: coverImage }} style={{ width: 100, height: 100, marginBottom: 10 }} />
              <Text className="mb-2">Imagen seleccionada: {coverImageName}</Text>
            </View>
          )}
          
          <TouchableOpacity onPress={uploadSong} className="bg-purple-500 p-2 rounded-md mb-2">
            <Text className="text-white text-center">Subir Canción</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onClose} className="bg-red-500 p-2 rounded-md">
            <Text className="text-white text-center">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}