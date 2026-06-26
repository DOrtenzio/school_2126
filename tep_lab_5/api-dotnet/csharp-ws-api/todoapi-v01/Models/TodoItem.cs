using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace TodoApi.Models
{
    [Table("todos", Schema = "todoapp")]
    public class TodoItem
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        [Column(TypeName = "bit")]
        public bool IsComplete { get; set; }
        public int CategoryId { get; set; }
        public int ListId { get; set; }
    }
}
