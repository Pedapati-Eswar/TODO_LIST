import { Component, OnInit } from '@angular/core';
import { ToDo } from '../../todo';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodoItem } from "../todo-item/todo-item";
import { AddTodo } from "../add-todo/add-todo";
import { TodoService } from '../../services/todo.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-to-dos',
  standalone: true,
  imports: [CommonModule, FormsModule, TodoItem, AddTodo, HttpClientModule],
  templateUrl: './to-dos.html',
  styleUrl: './to-dos.css'
})
export class ToDos implements OnInit { 

  todos: ToDo[] = [];
  filteredTodos: ToDo[] = [];
  selectedCategory: string = 'All';
  categories: string[] = ['All', 'Work', 'Personal', 'Study', 'Today', 'This Week'];
  
  constructor(private todoService: TodoService) {}

  ngOnInit(): void {
    this.loadTodos();
  }

  loadFromLocalStorage(): void {
    const localItem = localStorage.getItem("todos");
    if (localItem != null) {
      this.todos = JSON.parse(localItem);
    } else {
      this.todos = [];
    }
  }

  saveToLocalStorage(): void {
    localStorage.setItem("todos", JSON.stringify(this.todos));
  }

  loadTodos(): void {
    this.todoService.getTodos().subscribe({
      next: (todos) => {
        this.todos = todos;
        this.filterTodos();
      },
      error: (error) => {
        console.error('Error loading todos:', error);
        // Fallback to localStorage if API fails
        const localItem = localStorage.getItem("todos");
        if (localItem != null) {
          this.todos = JSON.parse(localItem);
          this.filterTodos();
        }
      }
    });
  }

  filterTodos(): void {
    if (this.selectedCategory === 'All') {
      this.filteredTodos = this.todos;
    } else {
      this.filteredTodos = this.todos.filter(todo => todo.category === this.selectedCategory);
    }
  }

  onCategoryChange(): void {
    this.filterTodos();
  }

 deleteToDo(todo: ToDo): void {
  console.log('Deleting todo:', todo); // 👈 Debug: see what ID the todo has
  const id = (todo as any)._id || (todo as any).id; // handle both cases (_id or id)

  if (id) {
    this.todoService.deleteTodo(id).subscribe({
      next: () => {
        // Remove the todo locally
        const index = this.todos.indexOf(todo);
        if (index > -1) this.todos.splice(index, 1);

        // Save and refresh the filtered list
        this.saveToLocalStorage();
        this.filterTodos();
      },
      error: (error) => {
        console.error('Error deleting todo:', error);

        // Fallback (if API fails)
        const index = this.todos.indexOf(todo);
        if (index > -1) this.todos.splice(index, 1);
        this.saveToLocalStorage();
        this.filterTodos();
      }
    });
  } else {
    console.warn('Todo has no ID, deleting locally...');
    const index = this.todos.indexOf(todo);
    if (index > -1) this.todos.splice(index, 1);
    this.saveToLocalStorage();
    this.filterTodos();
  }
}


  addToDo(todo: ToDo): void {
    this.todoService.createTodo({ title: todo.title, desc: todo.desc, category: todo.category }).subscribe({
      next: (newTodo) => {
        this.todos.unshift(newTodo); // Add to beginning of array
        this.filterTodos();
      },
      error: (error) => {
        console.error('Error adding todo:', error);
        // Fallback to localStorage on error
        todo.sno = this.todos.length + 1;
        todo.active = true;
        this.todos.unshift(todo);
        this.saveToLocalStorage();
        this.filterTodos();
      }
    });
  }

  toggleCheck(todo: ToDo): void {
    if (todo._id) {
      this.todoService.toggleTodo(todo._id).subscribe({
        next: (updatedTodo) => {
          const index = this.todos.indexOf(todo);
          this.todos[index] = updatedTodo;
        },
        error: (error) => {
          console.error('Error toggling todo:', error);
          // Fallback to localStorage on error
          todo.active = !todo.active;
          this.saveToLocalStorage();
        }
      });
    }
  }
}
