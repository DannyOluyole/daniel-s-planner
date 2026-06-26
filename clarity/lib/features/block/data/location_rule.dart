class LocationRule {
  const LocationRule({
    required this.id,
    required this.name,
    required this.lat,
    required this.lng,
    required this.radiusMeters,
    required this.packageNames,
    required this.appNames,
  });

  final String       id;
  final String       name;
  final double       lat;
  final double       lng;
  final double       radiusMeters;
  final List<String> packageNames; // packages blocked at this location
  final List<String> appNames;     // display names (parallel to packageNames)

  LocationRule copyWith({
    String? name,
    double? lat,
    double? lng,
    double? radiusMeters,
    List<String>? packageNames,
    List<String>? appNames,
  }) =>
      LocationRule(
        id:           id,
        name:         name           ?? this.name,
        lat:          lat            ?? this.lat,
        lng:          lng            ?? this.lng,
        radiusMeters: radiusMeters   ?? this.radiusMeters,
        packageNames: packageNames   ?? this.packageNames,
        appNames:     appNames       ?? this.appNames,
      );

  Map<String, dynamic> toJson() => {
    'id':      id,
    'name':    name,
    'lat':     lat,
    'lng':     lng,
    'radius':  radiusMeters,
    'packages': packageNames,
    'appNames': appNames,
  };

  factory LocationRule.fromJson(Map<String, dynamic> j) => LocationRule(
    id:           j['id']   as String,
    name:         j['name'] as String,
    lat:          (j['lat']  as num).toDouble(),
    lng:          (j['lng']  as num).toDouble(),
    radiusMeters: (j['radius'] as num).toDouble(),
    packageNames: (j['packages'] as List).cast<String>(),
    appNames:     (j['appNames'] as List? ?? []).cast<String>(),
  );

  String get coordLabel {
    final latStr = '${lat.abs().toStringAsFixed(4)}°${lat >= 0 ? 'N' : 'S'}';
    final lngStr = '${lng.abs().toStringAsFixed(4)}°${lng >= 0 ? 'E' : 'W'}';
    return '$latStr, $lngStr';
  }
}
