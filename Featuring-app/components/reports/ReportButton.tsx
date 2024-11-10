import React, { useState } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { ReportModal } from './ReportModal';

interface ReportButtonProps {
  contentId: string | number;
  contentType: 'perfil' | 'cancion' | 'video' | 'chat';
  reportedUserId: string;
  currentUserId: string;
  buttonStyle?: string;
  buttonText?: string;
  iconOnly?: boolean;
}

export const ReportButton: React.FC<ReportButtonProps> = ({
  contentId,
  contentType,
  reportedUserId,
  currentUserId,
  buttonStyle = "",
  buttonText = "Reportar",
  iconOnly = false
}) => {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowReportModal(true)}
        className={`${iconOnly ? 'p-2 rounded-full' : 'py-2 px-4 rounded-lg'} ${buttonStyle}`}
      >
        {iconOnly ? (
          <Ionicons name="warning" size={20} color="#DC2626" />
        ) : (
          <Text className="text-white font-semibold text-center">{buttonText}</Text>
        )}
      </TouchableOpacity>

      <ReportModal
        isVisible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentId={contentId}
        contentType={contentType}
        reportedUserId={reportedUserId}
        currentUserId={currentUserId}
      />
    </>
  );
}; 