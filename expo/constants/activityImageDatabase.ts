import { ActivityCategory } from '@/types/activities';

interface CityActivityImages {
  [category: string]: string[];
}

const CITY_IMAGES: Record<string, CityActivityImages> = {
  tokyo: {
    adventure: [
      'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600',
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600',
      'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=600',
    ],
    culture: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600',
      'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600',
      'https://images.unsplash.com/photo-1528164344705-47542687000d?w=600',
      'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=600',
      'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=600',
    ],
    food: [
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600',
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600',
      'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=600',
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600',
    ],
    nature: [
      'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600',
      'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=600',
      'https://images.unsplash.com/photo-1522623349500-de288cb8a136?w=600',
    ],
    nightlife: [
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600',
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600',
      'https://images.unsplash.com/photo-1554797589-7241bb691973?w=600',
    ],
    tickets: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600',
      'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=600',
    ],
    wellness: [
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600',
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600',
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
    ],
    water: [
      'https://images.unsplash.com/photo-1504682440024-0e41d4481968?w=600',
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=600',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    ],
  },
  bali: {
    adventure: [
      'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=600',
      'https://images.unsplash.com/photo-1558005137-d9619a5c539f?w=600',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600',
    ],
    culture: [
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600',
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600',
      'https://images.unsplash.com/photo-1558005137-d9619a5c539f?w=600',
      'https://images.unsplash.com/photo-1604922824961-87cefb2e4b07?w=600',
    ],
    food: [
      'https://images.unsplash.com/photo-1552301726-4e7081d61e09?w=600',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
    ],
    nature: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=600',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600',
      'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600',
      'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600',
    ],
    water: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600',
      'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=600',
      'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600',
      'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600',
    ],
    wellness: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600',
      'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600',
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600',
    ],
    nightlife: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600',
    ],
    tickets: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600',
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600',
      'https://images.unsplash.com/photo-1604922824961-87cefb2e4b07?w=600',
    ],
  },
  paris: {
    adventure: [
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=600',
      'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=600',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600',
    ],
    culture: [
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600',
      'https://images.unsplash.com/photo-1461344577544-4e5dc9487184?w=600',
      'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=600',
      'https://images.unsplash.com/photo-1564594736624-def7a10ab047?w=600',
      'https://images.unsplash.com/photo-1584266032559-fe65da685710?w=600',
    ],
    food: [
      'https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=600',
      'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
    ],
    nature: [
      'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=600',
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
      'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=600',
    ],
    nightlife: [
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600',
    ],
    tickets: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600',
      'https://images.unsplash.com/photo-1461344577544-4e5dc9487184?w=600',
    ],
    wellness: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600',
      'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600',
    ],
  },
  dubai: {
    adventure: [
      'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=600',
      'https://images.unsplash.com/photo-1548693590-54d15144c026?w=600',
      'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600',
      'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=600',
    ],
    culture: [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600',
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600',
      'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=600',
    ],
    food: [
      'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=600',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
    ],
    water: [
      'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
      'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600',
    ],
    nightlife: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600',
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600',
    ],
    tickets: [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600',
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600',
      'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=600',
    ],
    nature: [
      'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=600',
      'https://images.unsplash.com/photo-1548693590-54d15144c026?w=600',
      'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=600',
    ],
    wellness: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600',
      'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600',
    ],
  },
  barcelona: {
    adventure: [
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600',
      'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=600',
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600',
    ],
    culture: [
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600',
      'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=600',
      'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=600',
      'https://images.unsplash.com/photo-1564221710304-0b37c8b4c98c?w=600',
    ],
    food: [
      'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600',
    ],
    water: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
      'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600',
    ],
    nightlife: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600',
    ],
    nature: [
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600',
    ],
    tickets: [
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600',
      'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=600',
      'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=600',
    ],
    wellness: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600',
      'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600',
    ],
  },
  rome: {
    adventure: [
      'https://images.unsplash.com/photo-1515859005217-8a1f08870f59?w=600',
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600',
      'https://images.unsplash.com/photo-1533692328991-08159ff19fca?w=600',
    ],
    culture: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600',
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=600',
      'https://images.unsplash.com/photo-1596097635121-14b63a7eda29?w=600',
    ],
    food: [
      'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=600',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
    ],
    nature: [
      'https://images.unsplash.com/photo-1515859005217-8a1f08870f59?w=600',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
    ],
    nightlife: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600',
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600',
    ],
    tickets: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600',
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600',
    ],
    wellness: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600',
      'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600',
    ],
  },
  bangkok: {
    adventure: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600',
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600',
      'https://images.unsplash.com/photo-1533692328991-08159ff19fca?w=600',
    ],
    culture: [
      'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600',
      'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600',
    ],
    food: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
      'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600',
    ],
    nature: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600',
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=600',
    ],
    nightlife: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600',
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600',
    ],
    tickets: [
      'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600',
      'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600',
    ],
    wellness: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600',
      'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600',
    ],
  },
  lisbon: {
    adventure: [
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600',
      'https://images.unsplash.com/photo-1533692328991-08159ff19fca?w=600',
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600',
    ],
    culture: [
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600',
      'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600',
      'https://images.unsplash.com/photo-1548707309-dcebeab426c8?w=600',
      'https://images.unsplash.com/photo-1513735492284-ecb5e14e4c0b?w=600',
    ],
    food: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600',
    ],
    water: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
      'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600',
    ],
    nightlife: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
    ],
    nature: [
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600',
    ],
    tickets: [
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600',
      'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600',
      'https://images.unsplash.com/photo-1548707309-dcebeab426c8?w=600',
    ],
    wellness: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600',
      'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600',
    ],
  },
};

const GENERIC_CATEGORY_IMAGES: Record<string, string[]> = {
  adventure: [
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600',
    'https://images.unsplash.com/photo-1533692328991-08159ff19fca?w=600',
    'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600',
    'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600',
    'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=600',
  ],
  culture: [
    'https://images.unsplash.com/photo-1508159452718-d22f9893a9eb?w=600',
    'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600',
    'https://images.unsplash.com/photo-1461344577544-4e5dc9487184?w=600',
    'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600',
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
  ],
  nature: [
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=600',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600',
  ],
  wellness: [
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
    'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600',
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600',
    'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600',
  ],
  water: [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
    'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600',
    'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600',
  ],
  tickets: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600',
  ],
};

const CITY_TRAVEL_FALLBACK: Record<string, string[]> = {
  tokyo: [
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600',
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600',
    'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600',
  ],
  bali: [
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600',
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=600',
    'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600',
  ],
  paris: [
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600',
    'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=600',
  ],
  dubai: [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600',
    'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600',
    'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=600',
  ],
  barcelona: [
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600',
    'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=600',
    'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=600',
  ],
  rome: [
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600',
    'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600',
    'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600',
  ],
  bangkok: [
    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600',
    'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600',
    'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600',
  ],
  lisbon: [
    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600',
    'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600',
    'https://images.unsplash.com/photo-1548707309-dcebeab426c8?w=600',
  ],
};

const GENERIC_TRAVEL_FALLBACK: string[] = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=600',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600',
  'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=600',
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600',
];

function shuffleArray<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getActivityImages(
  city: string,
  category: ActivityCategory,
  count: number = 4,
  seed?: number,
): string[] {
  const cityKey = city.toLowerCase().replace(/\s+/g, '_');
  const usedSeed = seed ?? (cityKey + category).split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  const cityImages = CITY_IMAGES[cityKey]?.[category];
  if (cityImages && cityImages.length >= count) {
    const shuffled = shuffleArray(cityImages, usedSeed);
    console.log(`[ImageDB] Found ${shuffled.length} city+category images for ${city}/${category}`);
    return shuffled.slice(0, count);
  }

  if (cityImages && cityImages.length > 0) {
    const generic = GENERIC_CATEGORY_IMAGES[category] || [];
    const combined = [...cityImages, ...generic.filter(img => !cityImages.includes(img))];
    const shuffled = shuffleArray(combined, usedSeed);
    console.log(`[ImageDB] Combined ${shuffled.length} images for ${city}/${category}`);
    return shuffled.slice(0, count);
  }

  const genericCat = GENERIC_CATEGORY_IMAGES[category];
  if (genericCat && genericCat.length > 0) {
    const shuffled = shuffleArray(genericCat, usedSeed);
    console.log(`[ImageDB] Using ${shuffled.length} generic category images for ${category}`);
    return shuffled.slice(0, count);
  }

  const cityFallback = CITY_TRAVEL_FALLBACK[cityKey];
  if (cityFallback && cityFallback.length > 0) {
    const shuffled = shuffleArray(cityFallback, usedSeed);
    console.log(`[ImageDB] Using city travel fallback for ${city}`);
    return shuffled.slice(0, count);
  }

  const shuffled = shuffleArray(GENERIC_TRAVEL_FALLBACK, usedSeed);
  console.log(`[ImageDB] Using generic travel fallback`);
  return shuffled.slice(0, count);
}

export function getPrimaryImage(
  city: string,
  category: ActivityCategory,
  seed?: number,
): string {
  const images = getActivityImages(city, category, 1, seed);
  return images[0] || GENERIC_TRAVEL_FALLBACK[0];
}

export function getSlideshowImages(
  city: string,
  category: ActivityCategory,
  minImages: number = 3,
  maxImages: number = 5,
  seed?: number,
): string[] {
  const images = getActivityImages(city, category, maxImages, seed);
  if (images.length >= minImages) {
    return images;
  }

  const cityKey = city.toLowerCase().replace(/\s+/g, '_');
  const fallback = CITY_TRAVEL_FALLBACK[cityKey] || GENERIC_TRAVEL_FALLBACK;
  const combined = [...images, ...fallback.filter(img => !images.includes(img))];
  return combined.slice(0, maxImages);
}
