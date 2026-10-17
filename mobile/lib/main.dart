import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';

void main() {
  runApp(const CampusFlowApp());
}

class CampusFlowApp extends StatelessWidget {
  const CampusFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CampusFlow AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.dark,
        ),
      ),
      home: const IssueReportScreen(),
    );
  }
}

class IssueReportScreen extends StatefulWidget {
  const IssueReportScreen({super.key});

  @override
  State<IssueReportScreen> createState() => _IssueReportScreenState();
}

class _IssueReportScreenState extends State<IssueReportScreen> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  bool _isSubmitting = false;
  XFile? _capturedImage;
  String _locationStatus = 'Tap to fetch live GPS location';
  double? _latitude;
  double? _longitude;

  late IO.Socket socket;
final String baseUrl = 'https://campusflow-api-qwfv.onrender.com';

  @override
  void initState() {
    super.initState();
    _initSocket();
  }

  void _initSocket() {
    socket = IO.io(baseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });
    socket.connect();
  }

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.camera);
    if (image != null) {
      setState(() {
        _capturedImage = image;
      });
    }
  }

  Future<void> _getGPSLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      setState(() => _locationStatus = 'Location services disabled');
      return;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        setState(() => _locationStatus = 'Location permissions denied');
        return;
      }
    }

    Position position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );

    setState(() {
      _latitude = position.latitude;
      _longitude = position.longitude;
      _locationStatus = '📍 GPS: ${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
    });
  }

  void _showInteractiveSuccessDialog(String category, String severity) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          backgroundColor: const Color(0xFF1E293B),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.emerald.withOpacity(0.2),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.emerald, width: 2),
                  ),
                  child: const Icon(
                    Icons.check_circle_rounded,
                    color: Colors.emeraldAccent,
                    size: 48,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Incident Reported!',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'CampusFlow AI Engine classified and synced your ticket live across campus admin nodes.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: Colors.grey),
                ),
                const SizedBox(height: 20),

                // AI Categorization Pill Card
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.slate700),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('AI Category:', style: TextStyle(fontSize: 12, color: Colors.slate400)),
                          Text(
                            category.isEmpty ? 'Auto-Detected' : category,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueAccent),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Priority Severity:', style: TextStyle(fontSize: 12, color: Colors.slate400)),
                          Text(
                            severity.isEmpty ? 'CRITICAL' : severity,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: severity == 'CRITICAL' ? Colors.roseAccent : Colors.amberAccent,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blueAccent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Back to Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _submitReport() async {
    if (_titleController.text.isEmpty || _descController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in both title and description')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final authRes = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          'email': 'admin@presidencyuniversity.in',
          'password': 'adminpassword123',
        }),
      );

      String token = '';
      if (authRes.statusCode == 200) {
        token = jsonDecode(authRes.body)['token'];
      } else {
        final regRes = await http.post(
          Uri.parse('$baseUrl/api/auth/register'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'name': 'Janith VC',
            'email': 'admin@presidencyuniversity.in',
            'password': 'adminpassword123',
            'role': 'admin'
          }),
        );
        if (regRes.statusCode == 201 || regRes.statusCode == 200) {
          token = jsonDecode(regRes.body)['token'];
        }
      }

      final res = await http.post(
        Uri.parse('$baseUrl/api/tickets'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'title': _titleController.text,
          'description': _descController.text,
          'location': {
            'building': 'Main Campus',
            'latitude': _latitude ?? 13.1691,
            'longitude': _longitude ?? 77.5352,
          },
          'imageUrl': _capturedImage != null ? _capturedImage!.path : '',
        }),
      );

      if (res.statusCode == 201) {
        if (!mounted) return;
        final resData = jsonDecode(res.body);
        final category = resData['category'] ?? 'Electrical Safety';
        final severity = resData['severity'] ?? 'CRITICAL';

        _titleController.clear();
        _descController.clear();
        setState(() {
          _capturedImage = null;
          _locationStatus = 'Tap to fetch live GPS location';
        });

        _showInteractiveSuccessDialog(category, severity);
      } else {
        throw Exception('HTTP ${res.statusCode}: ${res.body}');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.redAccent,
          duration: const Duration(seconds: 5),
          content: Text('Error: $e'),
        ),
      );
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  void _openAIChatbot() {
    final chatMsgController = TextEditingController();
    List<Map<String, String>> chatHistory = [
      {'sender': 'ai', 'text': 'Hello Janith! 👋 How can CampusFlow AI assist you today?'}
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                top: 20,
                left: 16,
                right: 16,
              ),
              child: SizedBox(
                height: 420,
                child: Column(
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.smart_toy, color: Colors.blueAccent),
                        SizedBox(width: 10),
                        Text('CampusFlow AI Assistant', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const Divider(color: Colors.grey),
                    Expanded(
                      child: ListView.builder(
                        itemCount: chatHistory.length,
                        itemBuilder: (context, i) {
                          final isUser = chatHistory[i]['sender'] == 'user';
                          return Align(
                            alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.symmetric(vertical: 4),
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: isUser ? Colors.blueAccent : const Color(0xFF1E293B),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(chatHistory[i]['text'] ?? '', style: const TextStyle(fontSize: 13)),
                            ),
                          );
                        },
                      ),
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: chatMsgController,
                            decoration: const InputDecoration(
                              hintText: 'Ask AI assistant...',
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.send, color: Colors.blueAccent),
                          onPressed: () async {
                            if (chatMsgController.text.isEmpty) return;
                            final userText = chatMsgController.text;
                            setModalState(() {
                              chatHistory.add({'sender': 'user', 'text': userText});
                            });
                            chatMsgController.clear();

                            try {
                              final authRes = await http.post(
                                Uri.parse('$baseUrl/api/auth/login'),
                                headers: {'Content-Type': 'application/json'},
                                body: jsonEncode({
                                  'email': 'admin@presidencyuniversity.in',
                                  'password': 'adminpassword123',
                                }),
                              );
                              final token = jsonDecode(authRes.body)['token'];

                              final res = await http.post(
                                Uri.parse('$baseUrl/api/tickets/chat'),
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': 'Bearer $token',
                                },
                                body: jsonEncode({'message': userText}),
                              );
                              final reply = jsonDecode(res.body)['reply'];
                              setModalState(() {
                                chatHistory.add({'sender': 'ai', 'text': reply});
                              });
                            } catch (e) {
                              setModalState(() {
                                chatHistory.add({'sender': 'ai', 'text': 'Unable to reach AI service right now.'});
                              });
                            }
                          },
                        )
                      ],
                    )
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CampusFlow AI Mobile'),
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openAIChatbot,
        backgroundColor: Colors.blueAccent,
        child: const Icon(Icons.smart_toy, color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Report Campus Incident',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'Issues are automatically classified & prioritized using AI NLP.',
              style: TextStyle(color: Colors.grey, fontSize: 13),
            ),
            const SizedBox(height: 20),

            GestureDetector(
              onTap: _pickImage,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.blueAccent.withOpacity(0.5)),
                ),
                child: _capturedImage == null
                    ? const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.camera_alt, color: Colors.blueAccent, size: 32),
                          SizedBox(height: 6),
                          Text('Tap to Capture Photo Evidence', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        ],
                      )
                    : Row(
                        children: [
                          const Icon(Icons.check_circle, color: Colors.green, size: 24),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Photo Attached: ${_capturedImage!.name}',
                              style: const TextStyle(fontSize: 12),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _titleController,
              decoration: InputDecoration(
                labelText: 'Issue Title',
                hintText: 'e.g. Exposed wiring near library entrance',
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _descController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'Description',
                hintText: 'Provide details on the issue...',
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 16),

            InkWell(
              onTap: _getGPSLocation,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.my_location, color: Colors.amber),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(_locationStatus, style: const TextStyle(fontSize: 13)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitReport,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blueAccent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: _isSubmitting
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        'Submit Incident Report',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}