using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Models;

namespace ListApi.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ListController : ControllerBase
    {
        private readonly ListContext _context;

        public ListController(ListContext context)
        {
            _context = context;

        }

        // GET: api/List
        [HttpGet]
        public async Task<ActionResult<IEnumerable<List>>> GetLists()
        {
            return await _context.Lists.ToListAsync();
        }

        // GET: api/List/5
        [HttpGet("{id}")]
        public async Task<ActionResult<List>> GetList(int id)
        {
            var ListItem = await _context.Lists.FindAsync(id);

            if (ListItem == null)
            {
                return NotFound();
            }

            return ListItem;
        }

        // POST: api/List
        [HttpPost]
        public async Task<ActionResult<List>> PostList(List item)
        {
            _context.Lists.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetList), new { id = item.Id }, item);
        }

        // PUT: api/List/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutList(int id, List item)
        {
            if (id != item.Id)
            {
                return BadRequest();
            }

            _context.Entry(item).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/List/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteListItem(int id)
        {
            var ListItem = await _context.Lists.FindAsync(id);

            if (ListItem == null)
            {
                return NotFound();
            }

            _context.Lists.Remove(ListItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

    }
}