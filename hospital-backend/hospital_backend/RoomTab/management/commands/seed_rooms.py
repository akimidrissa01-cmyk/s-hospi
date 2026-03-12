from django.core.management.base import BaseCommand
from RoomTab.models import Room, Bed


class Command(BaseCommand):
    help = 'Seed 50 rooms with beds'

    def handle(self, *args, **kwargs):
        # Room types and their prices
        room_types = [
            ('standard', 'Standard', 50),
            ('private', 'Privée', 100),
            ('semi_private', 'Semi-Privée', 75),
            ('intensive', 'Soins Intensifs', 200),
        ]
        
        rooms_created = 0
        beds_created = 0
        
        # Create 50 rooms across 5 floors (10 rooms per floor)
        for floor in range(1, 6):
            for i in range(1, 11):  # 10 rooms per floor
                room_number = f"{floor}{i:02d}"  # e.g., 101, 102, ..., 110
                
                # Determine room type based on room number
                type_index = (i - 1) % len(room_types)
                room_type, type_display, price = room_types[type_index]
                
                # Determine capacity based on room type
                if room_type == 'private':
                    capacity = 1
                elif room_type == 'semi_private':
                    capacity = 2
                elif room_type == 'intensive':
                    capacity = 1
                else:
                    capacity = 2 if i % 2 == 0 else 1
                
                # Create room
                room, created = Room.objects.get_or_create(
                    room_number=room_number,
                    defaults={
                        'floor': floor,
                        'room_type': room_type,
                        'status': 'free',
                        'capacity': capacity,
                        'price_per_day': price,
                        'features': self.get_features(room_type),
                    }
                )
                
                if created:
                    rooms_created += 1
                    
                    # Create beds for this room
                    for bed_num in range(1, capacity + 1):
                        Bed.objects.get_or_create(
                            room=room,
                            bed_number=f"{room_number}-{bed_num}",
                            defaults={'status': 'free'}
                        )
                        beds_created += 1
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully created {rooms_created} rooms and {beds_created} beds'
        ))
    
    def get_features(self, room_type):
        features_map = {
            'standard': 'Lit médicalisé, table de nuit, fauteuil, prise TV',
            'private': 'Lit médicalisé, table de nuit, fauteuil, TV,冰箱, salle de bain privée',
            'semi_private': 'Lit médicalisé, table de nuit, fauteuil, TV, salle de bain partagée',
            'intensive': 'Moniteur cardiaque, respirateur, pompe à perfusion, surveillance continue',
        }
        return features_map.get(room_type, '')
