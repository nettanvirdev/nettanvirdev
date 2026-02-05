// Sample data for preview
struct Message: Identifiable {
    var id: String
    var content: String
    var sender: String
    var timestamp: Date
}

struct Preview {
    static var messages: [Message] {
        [
            Message(id: "1", content: "Hello! How are you?", sender: "Alice", timestamp: Date()),
            Message(id: "2", content: "I’m good, thanks! Just working on a project.", sender: "Bob", timestamp: Date()),
            Message(id: "3", content: "That sounds great! Let me know if you need help!", sender: "Alice", timestamp: Date())
        ]
    }
}