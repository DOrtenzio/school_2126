using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TodoApi.Models
{
    public class ListContext : DbContext
    {
        public ListContext(DbContextOptions<ListContext> options)
            : base(options)
        {
        }

        public DbSet<List> Lists { get; set; }
    }
}
