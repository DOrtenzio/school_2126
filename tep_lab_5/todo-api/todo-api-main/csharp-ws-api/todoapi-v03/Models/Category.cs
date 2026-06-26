using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;

namespace TodoApi.Models
{
        [Table("categories", Schema = "todoapp")]
        public class Category
        {
            public int Id { get; set; }
            public string? Name { get; set; }

        }
}
