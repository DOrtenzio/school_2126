using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Models;

namespace ListMembershipApi.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ListMembershipController : ControllerBase
    {
        private readonly ListMembershipContext _context;
        private readonly UserContext _contextUser;

        public ListMembershipController(ListMembershipContext context, UserContext contextUser)
        {
            _context = context;
            _contextUser = contextUser;

        }

        // GET: api/ListMembership
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ListMembership>>> GetListMemberships()
        {
            return await _context.ListsMemberships.ToListAsync();
        }

        // GET: api/ListMembership/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ListMembership>> GetListMembership(int id)
        {
            var ListMembership = await _context.ListsMemberships.FindAsync(id);

            if (ListMembership == null)
            {
                return NotFound();
            }

            return ListMembership;
        }

        // GET: api/ListMembership/{id}/User
        [HttpGet("{id}/User")]
        public async Task<ActionResult<User>> GetListMembershipUser(int id)
        {
            var list= await _context.ListsMemberships.FindAsync(id);


            User? user;
            if (list is not null)
            {
                user = await _contextUser.Users.FindAsync(list.userId);
            }
            else
            {
                return NotFound();
            }

            if (user == null)
            {
                return NotFound();
            }

            return user;
        }

        // POST: api/ListMembership
        [HttpPost]
        public async Task<ActionResult<ListMembership>> PostListMembership(ListMembership item)
        {
            _context.ListsMemberships.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetListMembership), new { id = item.Id }, item);
        }

        // PUT: api/ListMembership/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutListMembership(int id, ListMembership item)
        {
            if (id != item.Id)
            {
                return BadRequest();
            }

            _context.Entry(item).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/ListMembership/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteListMembership(int id)
        {
            var ListMembership = await _context.ListsMemberships.FindAsync(id);

            if (ListMembership == null)
            {
                return NotFound();
            }

            _context.ListsMemberships.Remove(ListMembership);
            await _context.SaveChangesAsync();

            return NoContent();
        }

    }
}