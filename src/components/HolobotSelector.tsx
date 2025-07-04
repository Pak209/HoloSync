import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Image,
} from 'react-native';
import { UserHolobot } from '../types/user';
import { getRank } from '../types/holobot';
import { getHolobotImage } from '../utils/holobotImages';

interface HolobotSelectorProps {
  holobots: UserHolobot[];
  selectedHolobot: string | null;
  onSelect: (holobotName: string) => void;
  showWorkoutStatus?: boolean;
}

const HolobotSelector: React.FC<HolobotSelectorProps> = ({
  holobots = [],
  selectedHolobot,
  onSelect,
  showWorkoutStatus = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Check if Holobot has been used for Sync Training today
  const isHolobotUsedToday = (holobot: UserHolobot): boolean => {
    if (!holobot?.lastSyncWorkoutDate || !showWorkoutStatus) return false;
    
    try {
      const lastWorkoutDate = new Date(holobot.lastSyncWorkoutDate);
      const today = new Date();
      
      return (
        lastWorkoutDate.toDateString() === today.toDateString() &&
        (holobot.syncWorkoutCountToday || 0) > 0
      );
    } catch (error) {
      console.error('Error checking holobot usage:', error);
      return false;
    }
  };

  const selectedHolobotData = holobots?.find(
    h => h?.name?.toLowerCase() === selectedHolobot?.toLowerCase()
  );

  const renderHolobotItem = ({ item }: { item: UserHolobot }) => {
    if (!item?.name) return null;
    
    const isUsed = isHolobotUsedToday(item);
    const holobotLevel = item.level || 1;
    const holobotRank = item.rank || getRank(holobotLevel);
    
    return (
      <TouchableOpacity
        style={[
          styles.holobotItem,
          isUsed && styles.holobotItemUsed
        ]}
        onPress={() => {
          if (item.name) {
            onSelect(item.name);
            setModalVisible(false);
          }
        }}
        disabled={isUsed}
      >
        <Image 
          source={getHolobotImage(item.name)} 
          style={[
            styles.holobotItemImage,
            isUsed && styles.holobotItemImageUsed
          ]}
          resizeMode="contain"
        />
        <View style={styles.holobotItemInfo}>
          <View style={styles.holobotNameRow}>
            <Text style={[
              styles.holobotItemName,
              isUsed && styles.holobotItemNameUsed
            ]}>
              {item.name}
            </Text>
            {isUsed && (
              <Text style={styles.usedBadge}>✓ TRAINED</Text>
            )}
          </View>
          <Text style={[
            styles.holobotItemLevel,
            isUsed && styles.holobotItemLevelUsed
          ]}>
            LVL {holobotLevel}
          </Text>
          <Text style={[
            styles.holobotItemRank,
            isUsed && styles.holobotItemRankUsed
          ]}>
            {holobotRank}
          </Text>
        </View>
        <View style={styles.holobotItemStats}>
          <Text style={[
            styles.statText,
            isUsed && styles.statTextUsed
          ]}>
            EXP: {item.experience || 0}/{item.nextLevelExp || 100}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Your Holobot</Text>
      
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        {selectedHolobotData ? (
          <View style={styles.selectedHolobot}>
            <Image 
              source={getHolobotImage(selectedHolobotData.name)} 
              style={styles.selectedImage}
              resizeMode="contain"
            />
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedName}>{selectedHolobotData.name}</Text>
              <Text style={styles.selectedLevel}>
                LVL {selectedHolobotData.level || 1} • {selectedHolobotData.rank || getRank(selectedHolobotData.level || 1)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select a Holobot</Text>
        )}
        
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Holobot</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={holobots || []}
              renderItem={renderHolobotItem}
              keyExtractor={(item) => item?.name || Math.random().toString()}
              style={styles.holobotList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#37C9FF',
    marginBottom: 8,
    fontWeight: '600',
  },
  selector: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#37C9FF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedHolobot: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedImage: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 16,   
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedLevel: {
    fontSize: 12,
    color: '#37C9FF',
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#37C9FF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#37C9FF',
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37C9FF',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  holobotList: {
    padding: 20,
  },
  holobotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginBottom: 12,
  },
  holobotItemImage: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  holobotItemInfo: {
    flex: 1,
  },
  holobotItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  holobotItemLevel: {
    fontSize: 12,
    color: '#37C9FF',
    marginTop: 2,
  },
  holobotItemRank: {
    fontSize: 12,
    color: '#ff6b35',
    marginTop: 2,
  },
  holobotItemStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 10,
    color: '#666',
  },
  holobotItemUsed: {
    opacity: 0.5,
    backgroundColor: '#0a0a0a',
  },
  holobotItemImageUsed: {
    opacity: 0.5,
  },
  holobotNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  holobotItemNameUsed: {
    color: '#666',
  },
  holobotItemLevelUsed: {
    color: '#444',
  },
  holobotItemRankUsed: {
    color: '#444',
  },
  statTextUsed: {
    color: '#444',
  },
  usedBadge: {
    fontSize: 8,
    color: '#4ade80',
    backgroundColor: '#1a2e1a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
  },
});

export default HolobotSelector; 