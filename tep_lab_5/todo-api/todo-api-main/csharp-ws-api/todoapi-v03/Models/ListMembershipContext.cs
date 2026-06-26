using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TodoApi.Models
{
    public class ListMembershipContext : DbContext
    {
        public ListMembershipContext(DbContextOptions<ListMembershipContext> options)
            : base(options)
        {
        }

        public DbSet<ListMembership> ListsMemberships { get; set; }
    }
}
