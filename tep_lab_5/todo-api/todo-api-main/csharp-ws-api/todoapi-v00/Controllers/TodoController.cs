using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Models;

namespace todoapi_v00.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class TodoController : ControllerBase
    {
        private readonly TodoContext _context;
        private static List<LogUser> logUsers = new List<LogUser>();

        public TodoController(TodoContext context){
            _context = context;
        }

        // GET: api/todo/log/nome
        [HttpGet("log/{name}")]
        public async Task<ActionResult<IEnumerable<TodoItem>>> GetTodoItems(string name){
            var items = await _context.TodoItems.ToListAsync();
            logUsers.Add(new LogUser { 
                Name = name, 
                Operation = "GET", 
                Date = DateTime.Now 
            });
            return items;
        }

        //GET: api/todo/ismodificato/nome
        [HttpGet("ismodificato/{name}")]
        public ActionResult<bool> IsModificato(string name){
            var tuttiLogs= logUsers.OrderBy(l => l.Date).ToList();
            var userLogs = logUsers.Where(l => l.Name == name).OrderBy(l => l.Date).ToList();
            var ultimoGet = userLogs.LastOrDefault(l => l.Operation == "GET");
            if (ultimoGet == null) return false;
            bool modificatoDopoGet = tuttiLogs.Any(l => l.Date > ultimoGet.Date && l.Operation != "GET");
            return modificatoDopoGet;
        }

        // GET: api/todo/log/name/5
        [HttpGet("log/{name}/{id}")]
        public async Task<ActionResult<TodoItem>> GetTodoItem(string name, long id)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);

            if (todoItem == null)
            {
                return NotFound();
            }

            logUsers.Add(new LogUser { 
                Name = name, 
                Operation = "GET", 
                Date = DateTime.Now 
            });

            return todoItem;
        }

        // POST: api/Todo/name
        [HttpPost("{name}")]
        public async Task<ActionResult<TodoItem>> PostTodoItem(string name, TodoItem item){
            logUsers.Add(new LogUser { 
                Name = name, 
                Operation = "POST", 
                Date = DateTime.Now 
            });
            _context.TodoItems.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetTodoItem),
                new { name = name, id = item.Id },
                item
            );
        }

        // PUT: api/Todo/log/name/5
        [HttpPut("{name}/{id}")]
        public async Task<IActionResult> PutTodoItem(string name, long id, TodoItem item)
        {
            logUsers.Add(new LogUser { 
                Name = name, 
                Operation = "PUT", 
                Date = DateTime.Now 
            });

            if (id != item.Id){
                return BadRequest();
            }

            _context.Entry(item).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Todo/log/name/5
        [HttpDelete("{name}/{id}")]
        public async Task<IActionResult> DeleteTodoItem(string name, long id)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);

            if (todoItem == null)
            {
                return NotFound();
            }

            logUsers.Add(new LogUser { 
                Name = name, 
                Operation = "DELETE", 
                Date = DateTime.Now 
            });

            _context.TodoItems.Remove(todoItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}