
test("creates a todo", async () => {
    const result = await todoService.createTodo({
        title: "Finish assignment",
        state: "todo"
    });

    expect(result.title).toBe("Finish assignment");
    expect(result.state).toBe("todo");
});
  